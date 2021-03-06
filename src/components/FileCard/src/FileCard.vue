<template>
  <div class="file-card"
    :class="{ mini : mini, selected : selected }"
    @click="handleClick"
    @dblclick="handleDbClick"
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
        <span v-for="(item, index) in titleStrArr"
          :key="index"
          :class="{ highlight : item === searchKeyword }"
          v-show="!showTitleInput"
          ref="title"
          @click.stop="handleClickTitle">
          {{ item }}
        </span>
      </div>
      <div class="icon-stack">
        <div class="icon stick-top" v-if="isTop"></div>
        <div class="isShared" v-if="isShared"></div>
        <div class="need_push" v-if="need_push"></div>
        <div class="need_push local" v-if="need_push_local"></div>
      </div>
    </div>
    <div class="body" v-if="content.length > 0 && !mini && type === 'note'">
      <p class="content">{{ content }}</p>
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
import fetchLocal from '../../../utils/fetchLocal'
// import {
//   updateLocalFolder
// } from '@/service/local'

export default {
  name: 'FileCard',

  mixins: mixins,

  data () {
    return {
      selected: false,
      titleValue: '',
      titleEllipsis: '',
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
    pid: {
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
    },
    isTop: {
      type: Boolean,
      default: false
    },
    isShared: {
      type: Boolean,
      default: false
    },
    need_push: {
      type: Boolean,
      default: false
    },
    need_push_local: {
      type: Boolean,
      default: false
    },
    rawData: {
      type: Object,
      default: () => { return {} }
    }
  },

  computed: {
    ...mapGetters({
      viewFileType: 'GET_VIEW_FILE_TYPE',
      searchKeyword: 'GET_SEARCH_KEYWORD'
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
    },

    titleStrArr () {
      if (this.searchKeyword === '') {
        return [this.titleEllipsis]
      } else {
        return this.searchSubStr(this.titleEllipsis, this.searchKeyword)
      }
    }
  },

  watch: {
    title (val) {
      this.titleEllipsis = val.length > 26
        ? val.slice(0, 26) + '...'
        : val
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
    this.titleEllipsis = this.title.length > 26
      ? this.title.slice(0, 26) + '...'
      : this.title
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
    ...mapActions(['EDIT_FILE', 'DELETE_FILE']),

    handleClick () {
      this.dispatch('FileCardGroup', 'item-click', this)
      this.selected = true
      this.$emit('handleClick', this)
    },

    handleDbClick () {
      this.$emit('dblclick', this)
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
      let taskName = this.type === 'folder' ? 'updateLocalFolder' : 'updateLocalNote'

      fetchLocal(taskName, {
        id: this.file_id,
        title: this.titleValue
      }).then(res => {
        this.$hub.dispatchHub('renameListFile', this, res)
        if (res.type === 'folder') {
          this.$hub.dispatchHub('updateFile', this, {
            id: res._id,
            name: res.title
          })
        }
      })
    },

    searchSubStr (str, subStr) {
      let positions = []
      let arr = []
      let start = 0
      let end = 0
      let pos = str.indexOf(subStr)
      while (pos > -1) {
        positions.push(pos)
        end = pos
        arr.push(str.slice(start, end))
        arr.push(subStr)
        start = pos
        pos = str.indexOf(subStr, pos + 1)
      }
      arr.push(str.slice(positions[positions.length - 1] + subStr.length, str.length))
      return arr.filter(item => item !== '')
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-card
  width 100%
  padding 14px 20px
  border-bottom 1px solid #E9E9E9
  &.selected
    background-color #FFF5E2
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
  position relative
  width inherit
  display flex
  flex-direction row
  align-items center
  .title
    margin-left 10px
    font-size 13px
    span
      float left
    span.highlight
      background-color yellow
    &.folder:hover
      span
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
  background-image url(../../../assets/images/lanhu/doc@2x.png)
  background-repeat no-repeat
  background-position center
  background-size contain
  &.folder
    background-image url(../../../assets/images/lanhu/folder@2x.png)
  &.stick-top
    width 16px
    height 16px
    background-image url(../../../assets/images/lanhu/stick_top@2x.png)

.icon-stack
  // width 100%
  height 100%
  display flex
  flex-direction row
  justify-content flex-end
  align-items center
  div
    margin-left 10px

.need_push
  right 50px
  width 16px
  height 16px
  border-radius 50%
  background-image url(../../../assets/images/lanhu/sync@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center
  opacity .6
  &.local
    background-color green

.isShared
  right 50px
  width 20px
  height 20px
  background-image url(../../../assets/images/lanhu/share_highlight@2x.png)
  background-repeat no-repeat
  background-size contain
  background-position center

.body
  margin: 12px 0
  display flex
  align-items center
  color #696969
  .content
    display inline-block
    width 100%
    height 36px
    font-size 12px
    overflow hidden
    text-overflow ellipsis
    word-break break-all
    display -webkit-box
    -webkit-box-orient vertical
    -webkit-line-clamp 2


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
