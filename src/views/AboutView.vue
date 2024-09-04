<template>
  <div class="about">
    <h1 style="text-align: center">usdoc服务功能demo页面</h1>
    <el-form :inline="true" :model="form">
      <el-form-item label="请选择文件">
        <el-select v-model="form.fileSrc" placeholder="请选择">
          <el-option-group
              v-for="group in form.options"
              :key="group.label"
              :label="group.label">
            <el-option
                v-for="item in group.options"
                :key="item.value"
                :label="item.label + ' : ' + item.size"
                :value="item.value">
              <span style="float: left">{{ item.label }}</span>
              <span style="float: right; color: #8492a6; font-size: 13px">{{ item.size }}</span>
            </el-option>
          </el-option-group>
        </el-select>
      </el-form-item>
      <el-form-item label="预览模式">
        <el-select v-model="form.previewMode" placeholder="请选择，默认为高清模式">
          <el-option
              v-for="item in form.previewModes"
              :key="item.value"
              :label="item.label"
              :value="item.value">
            <span style="font-weight: 600">{{ item.label }}: </span>
            <span style="font-size: 12px">{{ item.tip }}</span>
          </el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="预览页面-工具栏是否显示下载按钮" v-if="!form.previewMode || form.previewMode === 0">
        <el-switch v-model="form.showDownLoadToolbar" active-text="显示" inactive-text="不显示" :active-value="0"
                   :inactive-value="1"></el-switch>
      </el-form-item>
      <el-form-item label="预览页面-工具栏是否显示打印按钮" v-if="!form.previewMode || form.previewMode === 0">
        <el-switch v-model="form.showPrintToolbar" active-text="显示" inactive-text="不显示" :active-value="0"
                   :inactive-value="1"></el-switch>
      </el-form-item>
      <el-form-item label="文字水印内容">
        <el-input placeholder="水印内容，为空则不显示水印" v-model="form.watermarkText" clearable
                  style="width: 260px"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" plain @click="preview">点击进行预览</el-button>
        <el-button type="primary" plain @click="download">点击进行下载</el-button>
      </el-form-item>
    </el-form>

    <div style=" display: flex">
      <el-input disabled v-model="previewUrl">
        <template #append>
          <el-button @click="copyText(previewUrl)">复制预览地址</el-button>
        </template>
      </el-input>
      <el-input disabled style="margin-left: 15px;" v-model="downLoadUrl">
        <template #append>
          <el-button @click="copyText(downLoadUrl)">复制下载地址</el-button>
        </template>
      </el-input>
    </div>

    <h2 style="text-align: center">预览效果: </h2>

    <div v-loading="iframeLoading" class="iframe-wrapper">
      <iframe
          id="iframe"
          :src="previewUrl"
          height="100%"
          width="100%"
          frameborder="0"></iframe>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'About',
  data () {
    return {
      form: {
        options: [ {
          label: 'PDF 文件',
          options: [ {
            value: 'http://10.198.6.181:31229/media/202409/03/20240903-184728-766-8099.pdf', // url地址
            label: '文件可用', // 文件名称
            size: '376M' // 文件大小
          }, {
            value: 'http://10.198.6.181:31229/media/202409/04/20240904-161116-169-855.pdf', // url地址
            label: '文件可用', // 文件名称
            size: '66M' // 文件大小
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/pdf文件测试-文件3.pdf',
            label: 'PDF .pdf 文件3',
            size: '63M'
          } ]
        }, {
          label: 'WORD 文件',
          options: [ {
            value: 'http://api.usdoc.cn/vw/20240709/doc文件测试-文件1.doc',
            label: 'WORD .doc 文件1',
            size: '0.3M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/doc文件测试-文件2.doc',
            label: 'WORD .doc 文件2',
            size: '5.4M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/doc文件测试-文件三.doc',
            label: 'WORD .doc 文件3',
            size: '19.1M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/docx文件测试-文件1.docx',
            label: 'WORD .docx 文件1',
            size: '0.3M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/docx文件测试-文件2.docx',
            label: 'WORD .docx 文件2',
            size: '5.4M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/docx文件测试-文件3.docx',
            label: 'WORD .docx 文件3',
            size: '19.1M'
          } ]
        }, {
          label: 'EXCEL 文件',
          options: [ {
            value: 'http://api.usdoc.cn/vw/20240709/xls文件测试-文件1.xls',
            label: 'EXCEL .xls 文件1',
            size: '4.2M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/xls文件测试-文件2.xls',
            label: 'EXCEL .xls 文件2',
            size: '5.6M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/xls文件测试-文件3.xls',
            label: 'EXCEL .xls 文件3',
            size: '15.2M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/xlsx文件测试-文件1.xlsx',
            label: 'EXCEL .xlsx 文件1',
            size: '0.1M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/xlsx文件测试-文件2.xlsx',
            label: 'EXCEL .xlsx 文件2',
            size: '5.04M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/xlsx文件测试-文件3.xlsx',
            label: 'EXCEL .xlsx 文件3',
            size: '17.3M'
          } ]
        }, {
          label: 'PPT 文件',
          options: [ {
            value: 'http://api.usdoc.cn/vw/20240709/ppt文件测试-文件1.ppt',
            label: 'PPT .ppt 文件1',
            size: '0.9M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/ppt文件测试-文件2.ppt',
            label: 'PPT .ppt 文件2',
            size: '2.62M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/ppt文件测试-文件3.ppt',
            label: 'PPT .ppt 文件3',
            size: '13.3M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/pptx文件测试-文件1.pptx',
            label: 'PPT .pptx 文件1',
            size: '0.5M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/pptx文件测试-文件2.pptx',
            label: 'PPT .pptx 文件2',
            size: '1.07M'
          }, {
            value: 'http://api.usdoc.cn/vw/20240709/pptx文件测试-文件3.pptx',
            label: 'PPT .pptx 文件3',
            size: '12.2M'
          } ]
        } ],
        fileSrc: '',
        previewModes: [
          {
            value: 0,
            label: '高清模式',
            tip: '该预览模式下顶部有工具栏：打印、全屏演示、下载、缩放等'
          },
          {
            value: 1,
            label: '极速模式',
            tip: '采用异步按需加载，解析速度快，解析结果准确。'
          },
          {
            value: 2,
            label: '图文模式',
            tip: '采用纯HTML解析，解析结果准确，不失真'
          }
        ],
        previewMode: '',
        showDownLoadToolbar: 1,
        showPrintToolbar: 1,
        watermarkText: ''
      },

      previewUrl: '',
      downLoadUrl: '',
      iframeLoading: false,
    }
  },
  methods: {

    // 预览
    async preview () {
      if (!this.form.fileSrc) {
        this.$message({
          message: '请务必选择文件',
          type: 'warning'
        })
        return
      }
      // sass服务地址；私有化部署后，需更改
      const serviceUrl = 'http://10.198.32.215'
      const url = `${serviceUrl}?m=${this.form.previewMode}&ud=${this.form.showDownLoadToolbar}&up=${this.form.showPrintToolbar}&watermark=${this.form.watermarkText}&src=${this.form.fileSrc}`
      const previewData = await axios.get(`http://10.198.6.181:31229/api/document/encryptionUrl?url=${encodeURIComponent(url)}`)
      console.log(previewData)
      this.previewUrl = previewData.data
      this.iframeLoad()
    },

    // 下载
    download () {
      if (!this.form.fileSrc) {
        this.$message({
          message: '请务必选择文件',
          type: 'warning'
        })
        return
      }
      // sass服务地址；私有化部署后，需更改
      const serviceUrl = 'http://10.198.32.215'
      this.downLoadUrl = `${serviceUrl}?format=down&watermark=${this.form.watermarkText}&src=${this.form.fileSrc}`

      this.handleDownLoad(this.downLoadUrl)
    },

    // 复制地址
    copyText (text) {
      navigator.clipboard.writeText(text).then(() => {
        this.$message.success('复制成功')
      }).catch(e => {
        this.$message.error('复制失败')
      })
    },

    // 判断iframe是否加载完成
    iframeLoad () {
      this.iframeLoading = true
      const _this = this
      const iframe = document.querySelector('#iframe')
      if (!iframe) return
      // 处理兼容行问题 兼容IE
      if (iframe.attachEvent) {
        iframe.attachEvent('onload', function () {
          // iframe加载完毕以后执行操作
          _this.iframeLoading = false
        })
      } else {
        iframe.onload = function () {
          // iframe加载完毕以后执行操作
          _this.iframeLoading = false
        }
      }
    },
    async handleDownLoad (url) {
      const loading = this.$loading({
        text: '下载中...',
        background: 'rgba(0, 0, 0, .6)'
      })
      const downDataBlob = await axios.get(url, {responseType: 'blob'})
      console.log(downDataBlob)
      const downloadElement = document.createElement('a')
      const href = window.URL.createObjectURL(downDataBlob.data) // 创建下载的链接
      downloadElement.href = href
      downloadElement.download = (this.form.fileSrc.split('/').reverse())[0] // 下载后文件名
      document.body.appendChild(downloadElement)
      downloadElement.click() // 点击下载
      document.body.removeChild(downloadElement) // 下载完成移除元素
      window.URL.revokeObjectURL(href) // 释放掉blob对象
      loading.close()
    }
  }
}
</script>

<style lang="scss">
.iframe-wrapper {
  height: 800px;
  width: 90%;
  margin: 20px auto;
}
</style>
<script setup>
</script>
