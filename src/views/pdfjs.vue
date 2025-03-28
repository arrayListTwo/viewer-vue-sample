<script>
import PdfViewer from '@/components/PdfViewer.vue'

export default {
  components: { PdfViewer },
  data() {
    return {
      // 支持三种形式：
      // 1. URL 字符串
      // pdfFile: '/documents/sample.pdf'

      // 2. File 对象
      pdfFile: null
    }
  },
  methods: {
    handleAnnotation(annot) {
      console.log('接收到标注事件:', annot)
    },
    onFileChange(e) {
      this.pdfFile = e.target.files[0]
    }
  }
}
</script>

<template>
  <div>
    <input type="file" @change="onFileChange" />
    <pdf-viewer
        v-if="pdfFile"
        :src="pdfFile"
        @annotation-click="handleAnnotation"
    />
  </div>
</template>

<style scoped>

</style>
