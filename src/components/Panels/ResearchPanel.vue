<template>
  <div>
    <modal
      width="480px"
      height="456px"
      top="10vh"
      transition-name="fade-in-down"
      title="研报提交"
      @close="closeResearchPanel"
      :visible.sync="isResearchPanelShowed">
      <div class="research-panel">
        <div class="form-item small">
          <div class="form-label">报告大类</div>
          <BSelect
            :width="'140px'"
            :height="'28px'"
            v-model="largeType"
            :placeholder="'报告大类'"
            ref="largeTypeSelect">
            <b-option
              v-for="(item, index) in largeTypeArr"
              :key="index"
              :label="item.name"
              :value="item.id"
              :labelProxy="'name'"
              :valueProxy="'id'"
              :children="item.children">
            </b-option>
          </BSelect>
        </div>
        <div class="form-item small">
          <div class="form-label">报告小类</div>
          <BSelect
            :width="'140px'"
            :height="'28px'"
            :disabled="smallTypeArr.length === 0"
            v-model="smallType"
            :placeholder="'报告小类'"
            ref="smallTypeSelect">
            <b-option
              v-for="(item, index) in smallTypeArr"
              :key="index"
              :label="item.name"
              :value="item.id"
              :labelProxy="'name'"
              :valueProxy="'id'"
              :children="item.children">
            </b-option>
          </BSelect>
        </div>
        <div class="form-item small" v-if="largeType != 100035 && largeType != 100031">
          <div class="form-label">选择股票</div>
          <Select
            class="stock-select"
            v-model="stock"
            :remote-method="stockMenuMethod"
            filterable
            :loading="loadingStock"
            remote>
            <Option
              v-for="(option, index) in stockMenuData"
              :value="option.value"
              :key="index">
              {{option.label}}
            </Option>
          </Select>
        </div>
        <div class="form-item small" v-if="largeType != 100031">
          <div class="form-label">选择行业</div>
          <Select
            class="stock-select"
            v-model="trade"
            :remote-method="tradeMenuMethod"
            filterable
            :loading="loadingTrade"
            remote>
            <Option
              v-for="(option, index) in tradeMenuData"
              :value="option.value"
              :key="index">
              {{option.label}}
            </Option>
          </Select>
        </div>
        <div class="form-item">
          <div class="form-label">报告标题</div>
          <textarea type="text"
            v-model="title"
            :class="{ error: showTitleError }"
            @blur="handleTitleBlur"/>
          <span class="tip-error" v-show="showTitleError">请不要超出50个中文字符长度</span>
        </div>
        <div class="form-item">
          <div class="form-label">关键字</div>
          <textarea type="text"
            v-model="keywords"
            :class="{ error: showKeywordError }"
            @blur="handleKeywordBlur"/>
          <span class="tip-error" v-show="showKeywordError">请不要超出50个中文字符长度</span>
        </div>
        <div class="form-item">
          <div class="form-label">摘要</div>
          <textarea type="text"
            v-model="summary"
            :class="{ error: showSummaryError }"
            @blur="handleSummaryBlur"/>
          <span class="tip-error" v-show="showSummaryError">请不要超出50个中文字符长度</span>
        </div>
        <div class="form-item">
          <div class="form-label">上传附件</div>
          <Upload
            multiple
            ref="upload"
            :show-upload-list="false"
            :before-upload="handleUpload"
            action=""
            style="width: 85%;padding-top: 7px;">
            <Button
              class="upload-button"
              icon="ios-cloud-upload-outline">新增文件
            </Button>
          </Upload>
          <ul class="upload-list" ref="uploadList">
            <li class="upload-list-item" v-for="(item, index) in uploadList" :key="index">
              <span>{{ item.name }}</span>
              <div class="icon-del" @click="deleteFile(item)"></div>
            </li>
          </ul>
        </div>
        <!-- <Loading class="loading" :type="8" fill="#DDAF59" v-if="isLoading"></Loading> -->
      </div>
      <div class="button-group" slot="footer">
          <div class="button primary" @click="postReport">完成</div>
          <div class="button" @click="closeResearchPanel">取消</div>
        </div>
    </modal>
  </div>
</template>

<script>
import { debounce } from 'lodash'
import { mapActions, mapGetters } from 'vuex'
import LocalDAO from '../../../db/api'
import {
  getReportStock,
  getReportTrade,
  getReportSubclass,
  addReport
} from '../../service'
import Loading from '@/components/Loading'

export default {
  name: 'ResearchPanel',

  components: {
    Loading
  },

  data () {
    const validateStrLen = (rule, value, callback) => {
      console.log('validateStrLen', rule, value)
      if (value === '') {
        callback(new Error('Please enter your password'))
      } else {
        if (value.length > 100) {
          callback(new Error('请不要超出50个中文字符长度'))
        }
        callback()
      }
    }
    return {
      isLoading: true,
      loadingStock: true,
      loadingTrade: true,
      isStockMenuVisible: false,
      largeType: '',
      smallType: '',
      stock: '',
      trade: '',
      titleFrom: {
        title: ''
      },
      title: '',
      showTitleError: false,
      keywords: '',
      showKeywordError: false,
      summary: '',
      showSummaryError: false,
      uploadList: [],
      largeTypeArr: [
        {
          name: '公司研究',
          id: '100029',
          children: []
        },
        {
          name: 'QDII内部报告',
          id: '100046',
          children: []
        },
        {
          name: '行业报告',
          id: '100035',
          children: []
        },
        {
          name: '宏观经济报告',
          id: '100031',
          children: []
        }
      ],
      smallTypeArr: [],
      stockMenuData: [],
      tradeMenuData: [],
      ruleCustom: {
        title: [
          // { required: true, message: '1111', trigger: 'blur' },
          { type: 'string', max: 20, message: 'Introduce no less than 20 words', trigger: 'blur' },
          // { validator: validateStrLen, trigger: 'blur' }
        ]
      }
    }
  },

  computed: {
    ...mapGetters({
      isResearchPanelShowed: 'GET_SHOW_RESEARCH_PANEL',
      userInfo: 'GET_USER_INFO',
      currentFile: 'GET_CURRENT_FILE'
    })
  },

  watch: {
    userInfo (val) {
      this.fdList = val.friend_list
    },

    uploadList (val) {
      console.log('watch-uploadList', val)
    },

    largeType (val) {
      console.log('watch-largeType', val)
      getReportSubclass({
        columnid: val
      }).then(resp => {
        this.smallTypeArr = resp.data.body.map(item => {
          return {
            name: item.name,
            id: item.objid,
            children: []
          }
        })
      })
    },

    title (val, oldVal) {
      if (val.length > 100) {
        
      }
    }
  },

  mounted () {
    this.uploadList = this.$refs.upload.fileList
  },

  methods: {
    ...mapActions([
      'TOGGLE_SHOW_RESEARCH_PANEL'
    ]),

    closeResearchPanel () {
      this.TOGGLE_SHOW_RESEARCH_PANEL(false)
    },
    
    handleUpload (file) {
      this.uploadList.push(file)
      this.$nextTick(() => {
        this.$refs.uploadList.scrollTop = 32 * (this.uploadList.length + 1)
      })
      return true
    },

    deleteFile (file) {
      let idx = this.uploadList.indexOf(file)
      this.uploadList.splice(idx, 1)
    },

    closeStockMenu () {
      this.isStockMenuVisible = false
    },

    stockMenuMethod: debounce(function (query) {
      this.searchStock(query)
    }, 300),

    tradeMenuMethod: debounce(function (query) {
      this.searchTrade(query)
    }, 300),

    searchStock (query) {
      this.loadingStock = true
      console.log('searchStock'. query)
      getReportStock({
        searchname: query.trim()
      }).then(resp => {
        this.loadingStock = false
        if (resp.data.returnCode === 200) {
          console.log('getReportStock', resp.data.body)
          this.stockMenuData = resp.data.body.body.map(item => {
            return {
              value: item.scode,
              label: item.sname,
              mktcode: item.mktcode
            }
          })
        } else {
          this.stockMenuData = []
        }
      })
    },

    searchTrade (query) {
      this.loadingTrade = true
      getReportTrade({
        searchname: query.trim()
      }).then(resp => {
        this.loadingTrade = false
        if (resp.data.returnCode === 200) {
          this.tradeMenuData = resp.data.body.map(item => {
            return {
              value: item.id,
              label: item.name,
              mktcode: item.mktcode
            }
          })
        } else {
          this.tradeMenuData = []
        }
      })
    },

    handleStockMenuClick (value) {
      console.log('handleStockMenuClick', value)
    },

    handleTitleBlur () {
      if (this.title.length > 100) {
        this.showTitleError = true
      } else {
        this.showTitleError = false
      }
    },

    handleKeywordBlur () {
      if (this.keywords.length > 100) {
        this.showKeywordError = true
      } else {
        this.showKeywordError = false
      }
    },

    handleSummaryBlur () {
      if (this.keywords.length > 100) {
        this.showSummaryError = true
      } else {
        this.showSummaryError = false
      }
    },

    postReport () {
      let stockItem = this.stockMenuData.filter(item => item.value === this.stock)[0]
      let tradeItem = this.tradeMenuData.filter(item => item.value === this.trade)[0]
      addReport({
        indcode: this.trade,
        indname: tradeItem.label,
        isupdatepeandeps: 0,
        mktcode: stockItem.mktcode,
        reporttypeid: this.smallType,
        scode: this.stock,
        scodename: stockItem.label,
        status: 50,
        stype: 2,
        keywords: this.keywords,
        summary: this.summary,
        title: this.title,
        username: this.userInfo.usercode
      }).then(res => {
        if (res.data.returnCode === 200) {
          this.closeResearchPanel()
        } else (
          this.$Message.error(res.data.returnMsg)
        )
      }).catch(err => {
        this.$Message.error(err)
      })
    }
  }
}
</script>

<style lang="stylus" scoped>
.lucency
  opacity 0

.research-panel
  position relative
  font-size 13px
  line-height 40px
  color #999
  padding 20px 30px 0

.form-item
  position relative
  width 100%
  display flex
  flex-direction row
  align-items baseline
  .form-label
    width 52px
    text-align left
  input
    padding-left 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    &:focus
      border 1px solid #DDAF59
  textarea
    width 85%
    height 46px
    line-height 24px
    margin-left 9px
    padding-left 10px
    margin-bottom 10px
    border-radius 4px
    border 1px solid #E9E9E9
    outline none
    resize none
    &:focus
      border 1px solid #DDAF59
    &.error
      border-color red

.form-item
  &.small
    float left
    width 48%
    margin-right 16px
    align-items center
    justify-content space-between
    &:nth-of-type(2n)
      margin-right 0
    input
      width 140px
      height 28px
  // .form-label
  //   margin-right 20px

.upload-button
  margin-left 10px
  &:hover
    color #DDAF59 !important
    border-color #DDAF59 !important

.upload-list
  position absolute
  width 85.4%
  height 100px
  right 0
  top 50px
  line-height 32px
  font-size 12px
  color #333
  overflow scroll
  .upload-list-item
    position relative

.icon-del
  position absolute
  top 50%
  right 12px
  transform translateY(-50%)
  width 24px
  height 24px
  background-image url('../../assets/images/lanhu/icon_del@2x.png')
  background-size contain
  background-position center
  background-repeat no-repeat

.button-group
  width 38%
  bottom 14px
  left 77%

.loading
  display flex
  width 100%
  height 100%
  left 0
  top 40px
  position absolute
  /* justify-items center */
  justify-content center
  align-items center

.stock-select
  width 140px !important
  height 28px !important
  position absolute !important
  top 6px !important
  left 63px !important

.tip-error
  position absolute
  bottom -10px
  left 64px
  color red
  font-size 12px
  line-height 18px
</style>

