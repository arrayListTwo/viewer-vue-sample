<template>
  <div class="pdf-wrapper">
    <h1>Hello PDF</h1>
    <input type="file" @change="onFileChange"/>
    <h2 style="text-align: center">PDF预览</h2>
    <div class="page-container">
      <canvas id="pdf-canvas" style="border: 1px solid black; direction: ltr"></canvas>
      <div id="text-layer"></div>
    </div>
  </div>
</template>

<script>
import {defineComponent} from 'vue'
import * as pdfjsLib from 'pdfjs-dist'
import 'pdfjs-dist/web/pdf_viewer.css' // 引入文本层样式

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
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    },
    onFileChange(e) {
      this.file = e.target.files[0]
      this.$nextTick(() => {
        this.loadPDF()
      })
    },
    async loadPDF() {

      let blobUrl = null

      try {
        // 临时创建 URL
        blobUrl = URL.createObjectURL(this.file)

        // 初始化加载任务
        const loadingTask = pdfjsLib.getDocument({
          url: blobUrl,
          disableAutoFetch: true, // 优化大文件加载
          // cMapUrl: '/cmaps/',
          // cMapPacked: true,
          // TODO: cMapUrl 什么作用
        })

        // 显示加载进度
        loadingTask.onProgress = (progress) => {
          const percent = Math.round((progress.loaded / progress.total) * 100)
          this.progress = `${percent}%`
          console.log(`加载进度: ${this.progress}`)
        }

        // 加载文档
        const pdf = await loadingTask.promise
        console.log(`文档包含 ${pdf.numPages} 页`)

        // 加载第一页
        const page = await pdf.getPage(1)

        // 计算视口
        const viewport = page.getViewport({
          scale: 1.5,
          rotation: 0  // 支持页面旋转
        })

        // 高清屏适配
        const outputScale = Math.min(window.devicePixelRatio, 2) // 限制最大缩放

        // 获取Canvas元素
        const canvas = document.getElementById('pdf-canvas')
        const ctx = canvas.getContext('2d', {
          willReadFrequently: true  // 优化频繁读取操作
        })

        // 设置Canvas尺寸
        canvas.width = Math.floor(viewport.width * outputScale)
        canvas.height = Math.floor(viewport.height * outputScale)
        canvas.style.width = `${Math.floor(viewport.width)}px`
        canvas.style.height = `${Math.floor(viewport.height)}px`

        // 渲染参数
        const renderContext = {
          canvasContext: ctx,
          viewport,
          transform: outputScale !== 1
              ? [outputScale, 0, 0, outputScale, 0, 0]
              : null
        }

        // 执行渲染
        await page.render(renderContext).promise
        console.log('页面渲染完成')

        // 添加文本层
        await this.renderTextLayer(page, viewport)

      } catch (e) {
        console.error('加载PDF文件失败:', e)
      } finally {
        // 释放 URL
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
        }
      }
    },
    async renderTextLayer(page, viewport) {
      console.log('渲染文本层')
      console.log(page, viewport)
      const textLayerDiv = document.getElementById('text-layer')
      textLayerDiv.innerHTML = ''
      // 关键修复：设置CSS变量
      textLayerDiv.style.setProperty('--scale-factor', viewport.scale)

      const textContent = await page.getTextContent()

      // 创建文本层（新API）
      await pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayerDiv,
        viewport: viewport,
        textDivs: []
      })

    }
  }
})
</script>

<style>
.page-container {
  position: relative;
  margin: 20px auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

#text-layer {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  overflow: hidden;
  line-height: 1;
  pointer-events: none;
}

#text-layer > span {
  color: transparent;
  position: absolute;
  white-space: pre;
  cursor: text;
  pointer-events: all;
}

#text-layer ::selection {
  background: rgba(0, 0, 255, 0.3);
}
</style>
