<template>
  <div class="file-card"
    :class="{ mini : mini, selected : selected }"
    @click="handleClick"
    @contextmenu="handleContextmenu">
    <div class="header">
      <div class="icon" :class="type"></div>
      <div class="title ellipsis"
        :class="{ folder : viewFileType !== 'recycle' && type === 'folder' }">
        <input v-show="showTitleInput"
          ref="titleInput"
          type="text"
          v-model="titleValue"
          @blur="handleTitleInputBlur"
          @keyup.enter="handleTitleInputBlur">
        <span v-show="!showTitleInput"
          @click.stop="handleClickTitle">
          {{ title }}
        </span>
      </div>
    </div>
    <div class="body" v-if="content.length > 0 && !mini && type === 'doc'">
      <span class="content ellipsis">{{ content }}</span>
    </div>
    <div class="footer">
      <div class="path" v-if="!mini && selected && viewFileType === 'latest'">
        {{ parent_folder }}
      </div>
      <span class="time" v-if="isTimeShowed">{{ update_at }}</span>
      <span class="size" v-if="isSizeShowed">{{ file_size | size }}</span>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import mixins from '../mixins'

export default {
  name: 'FileCard',

  mixins: mixins,

  data () {
    return {
      selected: false,
      titleValue: '',
      showTitleInput: false
    }
  },

  props: {
    mini: {
      type: Boolean,
      default: false
    },
    type: {
      type: String,
      default: 'doc'
    },
    file_id: {
      type: String
    },
    title: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: ''
    },
    update_at: {
      type: String,
      default: ''
    },
    file_size: {
      type: Number,
      default: 0
    },
    parent_folder: {
      type: String
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE'
    }),

    isTimeShowed () {
      if (this.viewFileType === 'latest') {
        return this.mini || !this.selected
      } else {
        return true
      }
    },

    isSizeShowed () {
      if (this.type === 'folder') return false
      if (this.viewFileType === 'latest') {
        return !this.mini && !this.selected
      } else {
        return !this.mini
      }
    }
  },

  watch: {
    title (val) {
      this.titleValue = val
    }
  },

  filters: {
    size (val) {
      val = val + ''
      if (val.length <= 3) {
        return val + ' B'
      } else if (val.length <= 6) {
        return (parseInt(val) / 1000).toFixed(2) + ' KB'
      } else if (val.length <= 9) {
        return (parseInt(val) / 1000000).toFixed(2) + ' MB'
      } else if (val.length <= 12) {
        return (parseInt(val) / 1000000000).toFixed(2) + ' GB'
      }
    }
  },

  created () {
    this.titleValue = this.title
  },

  mounted () {
    this.$on('select', index => {
      if (this.$vnode.key === index) {
        this.selected = true
      }
    })
    this.$on('cancelSelect', () => {
      this.selected = false
    })
  },

  methods: {
    ...mapActions(['SAVE_FILE_TITLE', 'DELETE_FILE']),

    handleClick () {
      this.dispatch('FileCardGroup', 'item-click', this)
      this.selected = true
      this.$emit('handleClick', this)
    },

    handleClickTitle () {
      if (this.type === 'folder') {
        this.dispatch('FileCardGroup', 'item-title-click', this)
      } else {
        this.handleClick()
      }
    },

    handleContextmenu () {
      this.$emit('contextmenu', this.$options.propsData)
    },

    handleTitleInputBlur () {
      this.showTitleInput = false
      this.SAVE_FILE_TITLE({
        id: this.file_id,
        title: this.titleValue
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-card
  width 100%
  padding 14px 10px
  border-bottom 1px solid #e6e6e6
  &.selected
    background-color #eff0f1
  &.mini
    height 50px
    display flex
    flex-direction row
    justify-content space-between
    align-items center
    .footer
      width 100px
      margin 0

.header
  width inherit
  display flex
  flex-direction row
  align-items center
  .title
    margin-left 10px
    font-size 13px
    &.folder:hover
      text-decoration underline
    input
      border none
      background-color transparent
      outline-color #6cb5f9
      color inherit
      font-size inherit
      font-weight inheirht
      font-family inherit
      &:focus
        background-color #fff

.icon
  width 18px
  height 18px
  border-radius 3px
  background-image url(../../../assets/images/document.png)
  background-repeat no-repeat
  background-position center
  background-size contain
  &.folder
    background-image url(../../../assets/images/folder.png)

.body
  margin: 12px 0
  display flex
  align-items center
  color #696969
  .content
    display inline-block
    width 100%
    height 18px
    font-size 12px

.footer
  margin 10px 0 0
  font-size 11px
  font-weight 500
  color #808080
  .size
    margin-left 20px
  .path
    display flex
    flex-direction row
    align-items center
    &::before
      content ''
      display block
      margin-right 6px
      width 16px
      height 16px
      background-image url(../../../assets/images/folder-open-fill.png)
      background-repeat no-repeat
      background-size contain
      background-position center
</style>