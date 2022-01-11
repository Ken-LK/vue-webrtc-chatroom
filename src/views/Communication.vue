<template>
  <div>
    <div class="video-div">
      <a-row type="flex" justify="start">
        <a-col :span="2" :offset="1">
          <a-input v-model="loginUserName" placeholder="请输入登录用户名"></a-input>
        </a-col>

        <a-col :span="2">
          <a-button type="primary" @click="join">加入会话</a-button>
        </a-col>

        <a-col :span="2" :offset="1">
          <a-input v-model="chatTo" placeholder="输入聊天对象"></a-input>
        </a-col>

        <a-col :span="2">
          <a-input v-model="chatMsg" placeholder="输入聊天内容"></a-input>
        </a-col>

        <a-col :span="1">
          <a-button type="primary" @click="sendMsg">发送</a-button>
        </a-col>

        <a-col :span="2">
          <a-button type="info" @click="initRTC">初始化本地视频</a-button>
        </a-col>

        <a-col :span="2">
          <a-button type="info" @click="closeRTC">关闭通话</a-button>
        </a-col>

        <a-col :span="1">
          <a-button type="info" @click="invite">邀请会话</a-button>
        </a-col>

      </a-row>

    </div>

    <a-row>
      <div style="padding-top: 10px">
        <a-col>
          <a-row type="flex" justify="start">
            <a-col :span="4">
              <span style="font-weight: bold;font-size: 15px">====聊天详情====</span>
            </a-col>
          </a-row>
          </a-col>

        <a-col>
          <a-row type="flex" justify="start">

            <a-col :span="4">
              <div v-html="chatContent"></div>
            </a-col>

            <a-col :span="4">
              <video id="video-self" width=200 height=150 style="background-color: green;" :src="localStream" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>

            <a-col :span="4">
              <video id="video" width=200 height=150 style="background-color: orange;" src="" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>
          </a-row>
        </a-col>

      </div>


    </a-row>

  </div>

</template>

<script>

import {createSocket, sendWSPush} from '@/utils/wsHandle'

export default {
  name: "Communication",
  data() {
    return {
      // websocket地址
      wsUrl: 'ws://localhost:3000/websocket',
      // 登录人名称
      loginUserName: '',
      // 上线信息
      chatContent: '',
      // rtc连接
      pc: null,
      // 本地视频流
      localStream: null,

      chatTo: '',

      chatMsg: '',
    }
  },
  mounted() {
    // 建立websocket连接
    createSocket(this.wsUrl)

    this.registerMsg()

    // this.initRTC()
  },
  methods: {
    registerMsg() {
      const getSocketData = e => { // 创建接收消息函数
        const data = e && e.detail.data
        const dataObj = JSON.parse(data)
        if (dataObj.type === 'offer') {
          this.answerOffer(dataObj)
        } else if (dataObj.type === 'offerAnswer') {
          this.setRemoteSDP(dataObj)
        } else if (dataObj.type === 'candidate') {
          this.setRemoteICE(dataObj)
        } else {
          this.chatContent += '<br>' + data
        }
        console.log('接收到的消息===', dataObj)
      }
      window.addEventListener('onmessageWS', getSocketData) // 注册监听事件
    },
    join() {
      sendWSPush({type: 'join', user: this.loginUserName})
    },
    sendMsg() {
      sendWSPush({type: "chat", user: this.loginUserName, sender: this.chatTo, content: this.chatMsg})
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
      // this.pc = new RTCPeerConnection(configuration);
      this.pc = new RTCPeerConnection(null);

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
        sendWSPush({type: "candidate", user: this.loginUserName, sender: this.chatTo, content: wapper.candidate});
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

    /**
     * @description 发送offer
     *
     */
    invite() {
      const offerOptions = {offerToReceiveVideo: 1, offerToReceiveAudio: 1};
      let _this = this
      this.pc.createOffer(offerOptions)
          .then(desc => {
            console.log("---gotDescription: ", desc);
            this.pc.setLocalDescription(desc)
                .then(() => {
                  console.warn("----本地准备就绪，准备发送offer----");
                  sendWSPush({
                    type: "offer",
                    user: _this.loginUserName,
                    sender: _this.chatTo,
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
      console.log("-----remoteDesc: ----:", remoteDesc);
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
              user: _this.loginUserName,
              sender: _this.chatTo,
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
</script>

<style scoped>

.video-div {
  padding-top: 30px;

}

</style>
