<template>
  <div>
    <a-divider orientation="left">
      <h3>
        欢迎 <span style="color: red">{{ $route.query.loginUserName }}</span>, 进入聊天室
        <a-button type="link" @click="quit">退出</a-button>
      </h3>

    </a-divider>

    <a-row>
      <a-col :span="8">
        <div style="width: 500px;height: 500px;margin-left: 30px ">
          <h3 style="margin-bottom: 16px">
            在线列表
          </h3>
          <a-list :grid="{ gutter: 10, column: 3 }" :data-source="onlineList" item-layout="vertical" size="small">
            <a-list-item slot="renderItem" slot-scope="item, index">
              <a-card :title="item.userName">
                <a-button @click="join" type="primary" :ghost="true">加入聊天</a-button>
              </a-card>
            </a-list-item>
          </a-list>
        </div>
      </a-col>

      <a-col :span="8">
        <a-row type="flex" justify="start">
          <div style="width: 500px;height: 500px; border: 1px dashed;margin-left: 30px ">
            <h3>聊天内容</h3>
            <a-col v-for="item in chatMsgList">
              {{ item.receiver }}
              {{ item.sender }}
              {{ item.content }}
            </a-col>
          </div>
        </a-row>
        <a-row type="flex" justify="center" style="margin-top: 20px">

          <a-col :span="10">
            <a-input type="textarea" :model="sendMsg" placeholder="请输入发送消息"></a-input>
          </a-col>
          <a-col :span="4">
            <a-button type="primary">发送消息</a-button>
          </a-col>

          <a-col :span="4">
            <a-button type="info">发起视频</a-button>
          </a-col>

          <a-col :span="4">
            <a-button type="danger">关闭视频</a-button>
          </a-col>

        </a-row>
      </a-col>

      <a-col :span="8">
        <div style="width: 500px;height: 500px; border:ridge;margin-left: 30px ">
          <h3>视频</h3>

          <a-row type="flex" justify="start">
            <a-col :span="4">
              <span style="font-weight: bold">自己:</span>
            </a-col>
            <a-col :span="10">
              <video id="video-self" style="background-color: green;" :src="localStream" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>
          </a-row>

          <a-row type="flex" justify="start">
            <a-col :span="4">
              <span style="font-weight: bold">张三:</span>
            </a-col>

            <a-col :span="10">
              <video id="video" style="background-color: orange;" src="" autoplay>
                你的浏览器不支持video
              </video>
            </a-col>

          </a-row>

        </div>

      </a-col>
    </a-row>


    <!--  <a-row>-->
    <!--    <div style="width: 300px;height: 800px;border: ridge;border-width:2px">-->
    <!--      <a-col style="font-weight: bold;" :span="8" >当前在线列表:</a-col>-->
    <!--      <a-col :span="20">-->
    <!--        <div v-for="item in onlineList" :key="item.userName">-->

    <!--          <a-row type="flex" justify="space-between">-->
    <!--            -->
    <!--            <a-col :span="10">{{item.userName}}</a-col>-->
    <!--            <a-col><a-button size="small">聊天</a-button></a-col>-->
    <!--          </a-row>-->

    <!--        </div>-->
    <!--      </a-col>-->


    <!--    </div>-->


    <!--  </a-row>-->
  </div>
</template>

<script>
import {createSocket, sendWSPush} from '@/utils/wsHandle'

export default {
  name: "ChatRoom",
  data() {
    return {
      onlineList: [{userName: '张三'}, {userName: '李四'}, {userName: '赵柳柳'}],
      chatMsgList: [
        {sender: '发送人1', receiver: '接收人1', content: '内容111'},
        {sender: '发送人1', receiver: '接收人1', content: '内容222'},
        {sender: '发送人1', receiver: '接收人1', content: '内容333'},
        {sender: '发送人1', receiver: '接收人1', content: '内容444'},
      ],
      sendMsg: null,
      localStream: null
    }
  },
  mounted() {
    // 建立websocket连接
    createSocket(process.env.VUE_APP_WS_URL)

    this.registerMsg()

    // this.initRTC()
  },
  methods: {
    registerMsg() {
      const getSocketData = e => { // 创建接收消息函数
        const data = e && e.detail.data
        const dataObj = JSON.parse(data)
        const type = dataObj.type

        switch (type) {
          case 'offer':
            this.answerOffer(dataObj);
            break
          case 'offerAnswer':
            this.setRemoteSDP(dataObj);
            break
          case 'candidate':
            this.setRemoteICE(dataObj);
            break
          case 'online':
            console.log("==当前登录用户==",dataObj)
            break
          default:
            console.log("==其他类型消息==",dataObj)

        }

      }
      window.addEventListener('onmessageWS', getSocketData) // 注册监听事件
    },
    join() {
      sendWSPush({type: 'join', user: this.$route.query.loginUserName})
    },
    quit() {
      this.$router.push({name: "Login"})
    }
  }
}
</script>

<style scoped>

</style>
