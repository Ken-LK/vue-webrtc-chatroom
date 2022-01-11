<template>

  <div>
    <div style="padding-top: 100px">
      <h1>Web Rtc 聊天室</h1>
    </div>

    <div style="padding-top: 100px">
      <a-form-model
                    ref="ruleForm"
                    :model="form"
                    :label-col="labelCol"
                    :wrapper-col="wrapperCol"
                    layout="inline"
                    :rules="rules">

        <a-form-model-item label="昵称" prop="userName">
          <a-input v-model="form.userName" placeholder="请输入昵称"></a-input>
        </a-form-model-item>

        <a-form-model-item>
          <a-button type="primary" @click="handleLogin">
            进入聊天室
          </a-button>
        </a-form-model-item>
      </a-form-model>
    </div>

  </div>

</template>

<script>
export default {
  name: "Login",
  data() {
    return {
      labelCol: { span: 5 },
      wrapperCol: { span: 16 },
      form: {
        userName: null,
      },

      rules: {
        userName: [
          {required: true, message: '请输入昵称', trigger: 'blur'},
        ],
      }
    }
  },
  methods: {
    handleLogin() {

      this.$refs.ruleForm.validate(valid => {
        if (valid) {
          this.$router.push({name: "ChatRoom",query: {loginUserName:this.form.userName}})
        } else {
          return false;
        }
      });
    }
  }
}
</script>

<style scoped>

</style>
