<template>
  <div class="about" id="about">
    <h1>This is an about page</h1>
    <h1>使用office在线预览</h1>
    <div class="container">
      <div class="btns">
        <!-- 微软 Office Web Viewer 服务 -->
        <button @click="previewOffice(docx)">预览docx</button>
        <button @click="previewOffice(xlsx)">预览xlsx</button>
        <button @click="previewOffice(pptx)">预览pptx</button>
        <!-- pdf 直接预览 -->
        <button @click="officeUrl = pdf">预览pdf</button>
        <!-- 复制分享地址 -->
        <button class="copy-btn" v-if="officeUrl" @click="copyToClipboard(officeUrl)">
          复制分享地址
        </button>
      </div>
      <!-- 通过 iframe 嵌入 -->
      <iframe class="previewOffice" :src="officeUrl"></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About',
  data() {
    return {
      officeUrl: '',
      docx: 'https://yjy-teach-oss.oss-cn-beijing.aliyuncs.com/solution/demo.docx',
      xlsx: 'https://yjy-teach-oss.oss-cn-beijing.aliyuncs.com/solution/demo.xlsx',
      pptx: 'https://yjy-teach-oss.oss-cn-beijing.aliyuncs.com/solution/demo.pptx',
      pdf: 'https://yjy-teach-oss.oss-cn-beijing.aliyuncs.com/solution/demo.pdf'
    }
  },
  methods: {
    // 使用微软 Office Web Viewer 服务预览 office 文件
    previewOffice(url){
      // 考虑到特殊字符，通过 encodeURIComponent 处理一下 url
      this.officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(url)}`
    },
    async copyToClipboard(text) {
      await navigator.clipboard.writeText(text)
      alert('复制成功')
    }
  }
}
</script>

<style lang="scss">
.container {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  .previewOffice {
    flex: 1;
  }
  .copy-btn {
    background-color: #070;
    color: #fff;
  }
}
</style>
