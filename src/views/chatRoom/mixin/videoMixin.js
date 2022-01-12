import {sendWSPush} from "@/utils/wsHandle";

export const videoMixin = {
    data() {
        return {
            isDisplayVideo:false,
            // rtc连接
            pc: null,
        }
    },


    methods : {
        startVideo(){
            this.isDisplayVideo = true
            this.initRTC()

        },
        inviteVideo(){
            this.invite()
        },
        closeVideo(){
            // this.isDisplayVideo = false
            this.closeRTC()
        },

        initRTC() {
            const configuration = {
                iceServers: [
                    {
                        'urls': 'stun:stun.l.google.com:19302'
                    }
                ],
                iceTransportPolicy: "all",
                iceCandidatePoolSize: "0"
            };
            // console.log("--config:", config)；
            this.pc = new RTCPeerConnection(configuration);
            // this.pc = new RTCPeerConnection(null);

            let mediaConstraints = {audio: true, video: true};
            let _this = this
            navigator.mediaDevices.getUserMedia(mediaConstraints)
                .then(function (localStream) {
                    // console.log("---获取本地媒体权限---");
                    let videoSelf = document.querySelector("#video-self");
                    videoSelf.srcObject = localStream;
                    localStream.getTracks().forEach(track => _this.pc.addTrack(track, localStream));
                })
                .catch(e => {
                    switch (e.name) {
                        case "NotFoundError":
                            alert("Unable to open your call because no camera and/or microphone were found.");
                            break;
                        case "SecurityError":
                            break;
                        case "PermissionDeniedError":
                            // Do nothing; this is the same as the user canceling the call.
                            break;
                        default:
                            alert("Error opening your camera and/or microphone: " + e.message);
                            break;
                    }
                });

            this.pc.ontrack = media => {
                console.log("----接收到远程的媒体流----", media);
                document.getElementById("video").srcObject = media.streams[0];
            }


            this.pc.onicecandidate = wapper => {
                console.log("---获取到candidate: ", wapper.candidate);
                if (!wapper.candidate) return;
                sendWSPush({type: "candidate", sender: this.self, receiver: this.chatTo, content: wapper.candidate});
            }

            this.pc.onnegotiationneeded = () => {
                console.log("---协商连接事件----")
                // console.warn("----WebRTC基础结构需要你重新启动会话协商过程onnegotiationneeded---");
            }

            this.pc.onicegatheringstatechange = () => {
                //非必要实现功能 除非你有特别的需求需要监视候选者的状态
                if (this.pc.iceGatheringState !== 'complete') return;
                console.log("----onicecandidate获取结束 gatheringStateChange: ");
            };

            this.pc.onicecandidateerror = error => {
                console.error("---获取候选者出错: ", error);
            };


        },
        closeRTC(){
            console.log('===pc===', this.pc)
            this.pc.close()
            this.pc.onicecandidate = null
            this.pc.onaddstream = null
            console.log('===pc11===', this.pc)
            let stream = document.querySelector("#video-self").srcObject
            let tracks = stream.getTracks()
            tracks.forEach(function(track) {
                // stopping every track
                track.stop();
            });

            stream = null

        },
        invite() {
            const offerOptions = {offerToReceiveVideo: 1, offerToReceiveAudio: 1};
            let _this = this
            this.pc.createOffer(offerOptions)
                .then(desc => {
                    console.log("---gotDescription: ", desc);
                    this.pc.setLocalDescription(desc)
                        .then(() => {
                            console.log("----本地准备就绪，准备发送offer----");
                            sendWSPush({
                                type: "offer",
                                sender: _this.self,
                                receiver: _this.chatTo,
                                content: _this.pc.localDescription
                            });
                        });
                }, err => {
                    console.log('Error creating offer: ', err);
                });

        },
        /**
         * @description 回复offer
         * @param {Object} data
         */
        answerOffer(data) {
            const remoteDesc = new RTCSessionDescription(data.content);
            console.log("-----answerOffer: ----:", remoteDesc);
            let _this = this
            this.pc.setRemoteDescription(remoteDesc)
                .then(function () {
                    _this.pc.createAnswer()
                })
                .then(function (answer) {
                    return _this.pc.setLocalDescription(answer)
                })
                .then(function () {
                    console.log("----发送应答offer-----");
                    sendWSPush({
                        type: "offerAnswer",
                        sender: _this.self,
                        receiver: _this.chatTo,
                        content: _this.pc.localDescription
                    });
                })
                .catch(err => {
                    console.warn("--应答offer发生错误: ", err)
                })
        },
        /**
         * @description 将接收到的answer offer的SDP设置到本地pc上
         * @param {Object} data
         */
        setRemoteSDP(data) {
            console.log("---接收到offerAnswer: ", data);
            const remoteDesc = new RTCSessionDescription(data.content);
            this.pc.setRemoteDescription(remoteDesc)
                .then(() => {
                    console.log("---invite成功设置远程SDP");
                });
        },
        /**
         * @description 将接收到的候选者icecandidate添加到pc(peerConnection)中
         * @param {Object} data icecandidate
         */
        setRemoteICE(data) {
            console.log("---接收到candidate: ", data);
            const candidate = new RTCIceCandidate(data.content);
            this.pc.addIceCandidate(candidate)
                .then(() => {
                    console.log("---设置远程candidate成功--:")
                })
                .catch(error => {
                    console.error("----设置candidate出错:　", error)
                })
        }
    }

}
