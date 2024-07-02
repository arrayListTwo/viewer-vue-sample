<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div>
      <a href="https://vw.usdoc.cn/?format=down&watermark=%E6%B5%8B%E8%AF%95%E6%96%87%E6%A1%A3%E4%BB%85%E4%BE%9B%E5%8F%82%E8%80%83&src=http://usdoc.cn/vw/%E6%96%87%E4%BB%B6%E6%A8%A1%E6%9D%BF.docx">下载word+水印</a>
    </div>
    <div>
      <el-button @click="previewDocx('docx')">预览docx文档</el-button>
      <el-button @click="previewDocx('pdf')">预览pdf文档</el-button>
    </div>
    <h2>当前预览 {{currentType}}</h2>
    <iframe
        class="iframe-wrapper"
        :src="url"
        frameborder="0"></iframe>
  </div>
</template>

<script>
export default {
  name: 'About',
  data() {
    return {
      url: 'https://vw.usdoc.cn/?watermark=%E6%B5%8B%E8%AF%95%E6%96%87%E6%A1%A3%E4%BB%85%E4%BE%9B%E5%8F%82%E8%80%83&src=http://usdoc.cn/vw/%E6%96%87%E4%BB%B6%E6%A8%A1%E6%9D%BF.docx',
      currentType: 'docx'
    }
  },
  methods: {
    previewDocx(type) {
      this.currentType = type
      if(type === 'docx') {
        this.url = 'https://vw.usdoc.cn/?watermark=%E6%B5%8B%E8%AF%95%E6%96%87%E6%A1%A3%E4%BB%85%E4%BE%9B%E5%8F%82%E8%80%83&src=http://usdoc.cn/vw/%E6%96%87%E4%BB%B6%E6%A8%A1%E6%9D%BF.docx'
      }else if(type === 'pdf') {
        this.url = 'https://vw.usdoc.cn/?watermark=%E6%96%87%E6%A1%A3%E4%BB%85%E4%BE%9B%E5%8F%82%E8%80%83&src=http://usdoc.cn/vw/PDF%E5%9C%A8%E7%BA%BF%E9%A2%84%E8%A7%88.pdf'
      }
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
