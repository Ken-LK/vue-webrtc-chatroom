<template>
  <div>
    <a-divider orientation="left">
      <h3>
        欢迎 <span style="color: red">{{ self }}</span>,
        当前<span style="color: #42b983">{{ onlineUserTotalNum }}</span>人在线
        <a-button type="link" @click="quit">退出</a-button>
      </h3>

    </a-divider>

    <a-row>
      <a-col :span="8">
        <div style="width: 500px;height: 500px;margin-left: 30px ">
          <!--          <h3 style="margin-bottom: 16px">-->
          <!--            在线列表-->
          <!--          </h3>-->
          <a-list :grid="{ gutter: 10, column: 3 }" :data-source="onlineList" item-layout="vertical" size="small">
            <a-list-item slot="renderItem" slot-scope="item, index">
              <a-card :title="item">
                <a-button @click="startChat(item)" type="primary" v-if="chatTo !== item">与ta唠嗑</a-button>
                <a-button @click="closeChat(item)" type="info" v-else>不想唠了</a-button>
              </a-card>
            </a-list-item>
          </a-list>
        </div>
      </a-col>

      <a-col :span="8">
        <a-row type="flex" justify="start">
          <div style="width: 500px;height: 500px; border: 1px dashed;margin-left: 30px " v-if="isChat">
            <h3 style="padding-right: 350px">正在和{{ chatTo }}唠嗑</h3>
            <a-col v-for="item in chatMsgList">
              <span style="padding-right: 350px" v-if="item.sender !== self ">
                {{ item.sender }}:{{ item.content }}
              </span>
              <span style="padding-left: 350px" v-else>
                {{ item.sender }}:{{ item.content }}
              </span>
            </a-col>
          </div>
        </a-row>
        <a-row style="margin-top: 20px" type="flex" justify="center" v-if="isChat">
          <a-col :span="16">
            <a-input type="textarea" v-model="sendMsg" placeholder="请输入发送消息"></a-input>
          </a-col>
        </a-row>
        <a-row type="flex" justify="center" style="margin-top: 20px" v-if="isChat">


          <a-col :span="4">
            <a-button type="primary" @click="sendChatMsg">发送</a-button>
          </a-col>

          <a-col :span="4">
            <a-button type="info" @click="startVideo">初始化视频</a-button>
          </a-col>

          <a-col :span="4">
            <a-button type="info" @click="inviteVideo">邀请视频</a-button>
          </a-col>

          <a-col :span="4">
            <a-button type="danger" @click="closeVideo">关闭视频</a-button>
          </a-col>

        </a-row>
      </a-col>

      <a-col :span="8" v-if="isDisplayVideo">
        <div style="width: 500px;height: 500px;margin-left: 30px ">
          <h3>视频</h3>

          <a-row type="flex" justify="start">
            <a-col :span="4">
              <span style="font-weight: bold">{{self}}</span>
            </a-col>
            <a-col :span="10">
              <video id="video-self" width=345 height=260 style="background-color: green;" :src="localStream" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>
          </a-row>

          <a-row type="flex" justify="start">
            <a-col :span="4">
              <span style="font-weight: bold">{{chatTo}}</span>
            </a-col>

            <a-col :span="10">
              <video id="video" width=345 height=260 style="background-color: orange;" src="" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>

          </a-row>

        </div>

      </a-col>
    </a-row>

  </div>
</template>

<script>
import {createSocket, sendWSPush, closeSocket} from '@/utils/wsHandle'
import {videoMixin} from "@/views/chatRoom/mixin/videoMixin";

export default {
  name: "ChatRoom",
  mixins:[videoMixin],
  data() {
    return {
      self: null,
      onlineList: [],
      chatMsgList: [],
      sendMsg: null,
      localStream: null,
      onlineUserTotalNum: 0,
      isChat: false,
      chatTo: '',
      otherMsgList: [],
      selfMsgList: []
    }
  },
  mounted() {
    this.self = this.$route.query.loginUserName
    // 建立websocket连接
    createSocket(process.env.VUE_APP_WS_URL)

    this.registerMsg()

    this.join()

    // this.initRTC()
  },
  beforeDestroy() {
    // 关闭socket连接
    closeSocket()
  },
  methods: {
    registerMsg() {
      const getSocketData = e => { // 创建接收消息函数
        const data = e && e.detail.data
        const receiveMsg = JSON.parse(data)
        const type = receiveMsg.type

        switch (type) {
          case 'offer':
            this.answerOffer(receiveMsg);
            break
          case 'offerAnswer':
            this.setRemoteSDP(receiveMsg);
            break
          case 'candidate':
            this.setRemoteICE(receiveMsg);
            break
          case 'online':
            console.log("==当前登录用户==", receiveMsg)
            this.onlineUserTotalNum = receiveMsg.onlineUserTotalNum
            // 剔除自己
            this.onlineList = receiveMsg.onlineUserList.filter(userName => userName !== this.self)
            break
          case 'chat':
            console.log("==聊天内容==", receiveMsg)
            this.chatMsgList.push(receiveMsg)

            break
          default:
            console.log("==其他类型消息==", receiveMsg)

        }

      }
      window.addEventListener('onmessageWS', getSocketData) // 注册监听事件
    },
    join() {
      sendWSPush({type: 'join', sender: this.$route.query.loginUserName})
    },
    startChat(chatTo) {

      this.isChat = true
      this.chatTo = chatTo

    },
    closeChat() {
      this.isChat = false
      this.chatTo = ''
    },
    quit() {
      this.$router.push({name: "Login"})
    },
    /**
     * 发送聊天信息
     */
    sendChatMsg(){
      let chatMsg = {
        type: 'chat',
        sender: this.self,
        receiver: this.chatTo,
        content: this.sendMsg
      }
      sendWSPush(chatMsg)
      this.sendMsg = null
    }
  }
}
</script>

<style scoped>

</style>
