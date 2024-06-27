<template>
  <div class="home">
    <img alt="Vue logo" src="../assets/logo.png">
    <el-button>el-button</el-button>
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <pdf-viewer class="viewer-container"></pdf-viewer>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'
import PdfViewer from '@/components/pdf-viewer.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld, PdfViewer
  }
}
</script>

<style lang="scss" scoped>
.viewer-container {
  height: 600px;
  width: 90%;
  margin: 20px auto;
}
</style>
