<template>
  <div class="container" @dblclick="handleDbClick">
    <div class="avatar" :class="{ expanded : viewType === 'expanded' }" @click="showUserPanel">
      <!-- <img src="file:////Users/bowiego/Desktop/WechatIMG44.jpeg" alt=""> -->
      <img :src="userInfo.image_url" alt="">
    </div>
    <div class="arrow" @click="isMenuVisible = true"></div>
    <Menu
      :data="menuData"
      :visible="isMenuVisible"
      @close="closeMenu"
      @itemClick="handleMenuClick">
    </Menu>
  </div>
</template>

<script>
import { ipcRenderer } from 'electron'
import { mapGetters, mapActions } from 'vuex'
import { saveAppConf } from '@/tools/appConf'

export default {
  name: 'User',

  data () {
    return {
      isMenuVisible: false,
      menuData: [
        {
          label: '个人信息',
          value: 'info'
        },
        {
          label: '偏好设置',
          value: 'setting'
        },
        {
          label: '注销登录',
          value: 'logout'
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      viewType: 'GET_VIEW_TYPE',
      userInfo: 'GET_USER_INFO'
    })
  },

  methods: {
    ...mapActions(['TOGGLE_SHOW_USER_PANEL', 'TOGGLE_SHOW_SETTING_PANEL']),

    handleDbClick () {
      let curWin = this.$remote.getCurrentWindow()
      let isMaximized = curWin.isMaximized()
      if (!isMaximized) {
        curWin.maximize()
      } else {
        curWin.unmaximize()
      }
    },

    showUserPanel () {
      this.TOGGLE_SHOW_USER_PANEL(true)
    },

    closeMenu () {
      this.isMenuVisible = false
    },

    handleMenuClick (value) {
      if (value === 'info') {
        this.showUserPanel()
      }
      if (value === 'logout') {
        saveAppConf(this.$remote.app.getAppPath('appData'), {
          user: null
        })
        ipcRenderer.send('changeWindow', {
          name: 'login'
        })
      }
      if (value === 'setting') {
        this.TOGGLE_SHOW_SETTING_PANEL(true)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.container
  width 100%
  position relative
  -webkit-app-region drag
.avatar
  width 40px
  height 40px
  margin 40px auto 0px
  border-radius 50%
  overflow hidden
  background-color #fff
  -webkit-app-region drag
  &.expanded
    margin 20px auto 0px
  img
    width 100%
    height 100%
.arrow
    position absolute
    right 35%
    top 61%
    display block
    content ''
    width 10px
    height 10px
    margin-left 10px
    border-top 5px solid transparent
    border-left 6px solid #949494
    border-bottom 5px solid transparent
    transform rotate(90deg)
.offline
  position absolute 
  left 10px
  top 10px
  color #fff
.menu
  position absolute !important
  top 70px !important
  left 10%
  // transform translateX(-50%)
</style>

