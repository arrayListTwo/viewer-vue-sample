<template>
  <div class="pdf-view" ref="pdfViewer"></div>
</template>
<script>

import PdfWebView from '@pdftron/pdfjs-express-viewer'

export default {
  name: 'pdf-viewer',
  props: {
    path: {
      type: String,
      default: process.env.BASE_URL
    }
  },
  mounted () {
    PdfWebView({
      path: `${this.path}pdf-viewer-lib`,
      initialDoc: `${process.env.BASE_URL}files/测试pdf文件.pdf`,
      licenseKey: 'aOWN16k2sFXSOXKDzvBH'
    }, this.$refs.pdfViewer).then(instance => {
      const {Core, UI} = instance
      console.log(Core)
      console.log(UI)
      const {
        documentViewer,
        annotationManager,
        Annotations
      } = Core;

      UI.disableElements(['searchButton']);
      UI.setTheme('dark');
      documentViewer.setMargin(20);

    })
  },
}
</script>

<style lang="scss" scoped>
.pdf-view {
  height: 100%;
  width: 100%;
}
</style>
