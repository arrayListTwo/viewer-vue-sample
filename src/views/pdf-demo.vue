<script>
import {defineComponent} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
// import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs'

export default defineComponent({
  name: "pdf-demo",
  data() {
    return {
      file: null
    }
  },
  async mounted() {
    this.initWorker()
  },
  methods: {
    initWorker() {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'
    },
    onFileChange(e) {
      this.file = e.target.files[0]
      this.$nextTick(() => {
        this.loadPDF()
      })
    },
    async loadPDF() {

      // Asynchronous download PDF
      const loadingTask = pdfjsLib.getDocument(URL.createObjectURL(this.file))
      loadingTask.onProgress = (progress) => {
        console.log(`加载进度: ${progress.loaded} / ${progress.total}`)
      }
      const pdf = await loadingTask.promise

      console.log('PDF加载完成:', pdf)
      console.log('PDF number:', pdf.numPages)
      console.log("PDF Info: ", pdf._pdfInfo)

      // Fetch the first page
      const page = await pdf.getPage(1)

      // 拼接文本内容
      const textContent = await page.getTextContent()
      const textItems = textContent.items.map(item => item.str).join(' ')
      console.log('Page Text:', textContent)
      console.log('Page Text:', textItems)
      console.log('Page Annotations:', await page.getAnnotations())
      // 拼接注释
      const annotations = await page.getAnnotations()
      annotations.forEach((annot, index) => {
        console.log(`Annotation ${index}:`, annot)
      })

      const scale = 1.5
      const viewport = page.getViewport({scale})
      console.log('Viewport transform: ', viewport.transform) // 坐标变换矩阵

      // Support HiDPI-screens.
      const outputScale = window.devicePixelRatio || 1

      // Prepare canvas using PDF page dimensions
      const canvas = document.getElementById('pdf-canvas')
      const context = canvas.getContext('2d')

      canvas.width = Math.floor(viewport.width * outputScale)
      canvas.height = Math.floor(viewport.height * outputScale)
      canvas.style.width = `${Math.floor(viewport.width)}px`
      canvas.style.height = `${Math.floor(viewport.height)}px`

      const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null

      // Render PDF page into canvas context
      const renderContext = {
        canvasContext: context,
        viewport,
        transform,
        background: 'rgba(255,255,255,1)',  // 背景色
        intent: 'display'  // 渲染模式（display/print）
      }

      const renderTask = page.render(renderContext)

      renderTask.promise.then(() => {
        console.log('页面渲染完成')
      })
    }
  }
})
</script>

<template>
  <div class="pdf-wrapper">
    <h1>Hello PDF</h1>
    <input type="file" @change="onFileChange" />
    <h2 style="text-align: center">PDF预览</h2>
    <canvas v-if="file" id="pdf-canvas" style="border: 1px solid black; direction: ltr"></canvas>
  </div>
</template>

<style scoped>

</style>
