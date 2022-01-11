import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/communication',
    name: 'Communication',
    component: () => import('../views/Communication.vue')
  },
  {
    path: '/',
    name: 'Login',
    component: () => import('../views/login')
  },
  {
    path: '/chat_room',
    name: 'ChatRoom',
    component: () => import('../views/chatRoom')
  }
]

const router = new VueRouter({
  mode:'history',
  routes
})

export default router
