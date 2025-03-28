<script>
import VuePdfEmbed from 'vue-pdf-embed'
import * as pdfjsLib from 'pdfjs-dist' // 修改导入方式

// 配置PDF.js worker路径（必须在导入后立即设置）
pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.5.375/pdf.worker.min.js'

export default {
  components: { VuePdfEmbed },
  props: {
    pdfUrl: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      pdfSource: this.pdfUrl,
      scale: 1.2,
      annotations: []
    }
  },
  methods: {
    async handlePdfLoaded() {
      const loadingTask = pdfjsLib.getDocument({
        url: this.pdfSource,
        cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.5.375/cmaps/',
        cMapPacked: true
      })

      try {
        const pdfDoc = await loadingTask.promise
        await this.extractAnnotations(pdfDoc)
        this.$nextTick(() => this.renderAnnotations())
      } catch (error) {
        console.error('PDF加载失败:', error)
      }
    },

    async extractAnnotations(pdfDoc) {
      this.annotations = []
      for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum)
        const annotations = await page.getAnnotations()
        this.annotations.push(
            ...annotations.map(annot => ({
              ...annot,
              pageNumber: pageNum,
              viewport: page.getViewport({ scale: this.scale })
            }))
        )
      }
    },

    renderAnnotations() {
      const container = this.$refs.pdfRef.$el
      const pages = container.querySelectorAll('.pdf-page')

      this.annotations.forEach(annotation => {
        const pageDiv = pages[annotation.pageNumber - 1]
        if (!pageDiv) return

        const annotEl = this.createAnnotationElement(annotation)
        pageDiv.appendChild(annotEl)
      })
    },

    createAnnotationElement(annotation) {
      const el = document.createElement('div')
      el.className = 'pdf-annotation'

      // 坐标转换（PDF坐标系转网页坐标系）
      const rect = this.normalizeCoordinates(
          annotation.rect,
          annotation.viewport
      )

      // 样式配置
      Object.assign(el.style, {
        position: 'absolute',
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.width}px`,
        height: `${rect.height}px`,
        backgroundColor: this.getAnnotationColor(annotation),
        pointerEvents: 'none',
        opacity: 0.4
      })

      // 添加点击事件
      if (annotation.contents) {
        el.style.pointerEvents = 'auto'
        el.dataset.content = annotation.contents
        el.addEventListener('click', this.handleAnnotationClick)
      }

      return el
    },

    normalizeCoordinates(rect, viewport) {
      // PDF坐标系转换为网页坐标系
      const [x1, y1, x2, y2] = rect
      const width = x2 - x1
      const height = y2 - y1

      return {
        x: x1 * viewport.width / viewport.viewBox[2],
        y: viewport.height - y2 * viewport.height / viewport.viewBox[3],
        width: width * viewport.width / viewport.viewBox[2],
        height: height * viewport.height / viewport.viewBox[3]
      }
    },

    getAnnotationColor(annotation) {
      const typeColors = {
        Highlight: 'rgba(255,255,0,0.3)',
        Underline: 'rgba(0,0,255,0.3)',
        StrikeOut: 'rgba(255,0,0,0.3)',
        FreeText: 'rgba(0,255,0,0.2)'
      }
      return typeColors[annotation.subtype] || 'rgba(200,200,200,0.3)'
    },

    handleAnnotationClick(event) {
      const content = event.target.dataset.content
      if (content) {
        this.$emit('annotation-click', content)
        alert(`标注内容：${content}`)
      }
    }
  }
}
</script>

<template>
  <div class="pdf-container">
    <vue-pdf-embed
        ref="pdfRef"
        :source="pdfSource"
        @loaded="handlePdfLoaded"
        class="pdf-viewer"
    />
  </div>
</template>

<style scoped>
.pdf-container {
  position: relative;
  overflow: auto;
  max-width: 100%;
  margin: 20px 0;
}

.pdf-viewer {
  position: relative;
}

.pdf-viewer /deep/ .pdf-page {
  position: relative;
  margin: 10px auto;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.pdf-annotation {
  transition: opacity 0.2s;
  cursor: pointer;
}

.pdf-annotation:hover {
  opacity: 0.8 !important;
  z-index: 1000;
}
</style>
