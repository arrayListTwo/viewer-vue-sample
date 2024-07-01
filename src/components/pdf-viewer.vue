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
      initialDoc: `${process.env.BASE_URL}files/goView开源项目.pdf`,
      // initialDoc: `${process.env.BASE_URL}files/测试pdf文件.pdf`,
      licenseKey: 'aOWN16k2sFXSOXKDzvBH'
    }, this.$refs.pdfViewer).then(instance => {
      const {Core, UI} = instance
      const {
        documentViewer,
      } = Core

      documentViewer.setWatermark({
        // Draw diagonal watermark in middle of the document
        custom: function (ctx, pageIndex, pageWidth, pageHeight) {
          const maxLine = Math.floor(pageWidth / 150)
          const maxColumn = Math.floor(pageHeight / 150)
          ctx.rotate(-20 * Math.PI / 180)// 设置水印元素的倾斜, 这一行代码要写在设置水印文字之前，涉及样式的都写在设置水印文字之前
          ctx.font = '26px serif' // 设置水印文字的大小和字体
          ctx.fillStyle = 'rgba(200, 200, 200, 0.8)' // 设置水印文字的颜色
          ctx.textAlign = 'left' // 文本左对齐
          const waterText = '中建八局一公司内部资料，仅限5004252使用，2024年07月01日'
          const waterMarkerWidth = ctx.measureText(waterText).width;
          for (let c = 1; c < maxColumn + 10; c++) {
            for (let l = 0; l < maxLine + 10; l++) {
              ctx.fillText(waterText, l * waterMarkerWidth - waterMarkerWidth, c * (waterMarkerWidth * 0.3) + l * 50, waterMarkerWidth)
            }
          }
        }
      })
    })
  }
}
</script>

<style lang="scss" scoped>
.pdf-view {
  height: 100%;
  width: 100%;
}
</style>
