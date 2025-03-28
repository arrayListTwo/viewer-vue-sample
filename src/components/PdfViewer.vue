<script>
import * as pdfjsLib from 'pdfjs-dist'

export default {
  props: {
    src: {
      type: [String, File, Uint8Array],
      required: true
    }
  },
  data() {
    return {
      pdfDoc: null,
      totalPages: 0,
      currentPage: 1,
      scale: 1.2,
      visiblePages: [], // 当前可见页
      renderQueue: [],  // 渲染队列
      isRendering: false,
      pageContainers: new Map() // 存储页面容器
    }
  },
  mounted() {
    this.initWorker()
    this.loadDocument()
  },
  beforeDestroy() {
    // 清理定时器
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }

    // 清理PDF对象
    if (this.pdfDoc) {
      this.pdfDoc.destroy()
    }
  },
  methods: {
    // 初始化 PDF.js Worker
    initWorker() {
      pdfjsLib.GlobalWorkerOptions.workerSrc =
          'https://cdn.bootcdn.net/ajax/libs/pdf.js/2.5.207/pdf.worker.min.js'
    },

    // 加载 PDF 文档
    async loadDocument() {
      try {
        const loadingTask = pdfjsLib.getDocument({
          url: this.getSourceUrl(),
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@2.5.207/cmaps/',
          cMapPacked: true
        })

        this.pdfDoc = await loadingTask.promise
        this.totalPages = this.pdfDoc.numPages
        this.updateVisiblePages()
      } catch (err) {
        this.$emit('error', err)
      }
    },

    // 获取文档源
    getSourceUrl() {
      if (this.src instanceof File) {
        return URL.createObjectURL(this.src)
      }
      return this.src
    },

    // 更新可见页面
    updateVisiblePages() {
      const container = this.$refs.container
      if (!container || !this.pdfDoc) return

      const scrollTop = container.scrollTop
      const clientHeight = container.clientHeight
      let accumulatedHeight = 0
      let startPage = 1
      let endPage = 1

      // 精确计算可见页范围
      for (let i = 1; i <= this.totalPages; i++) {
        const page = this.visiblePages.find(p => p.pageNumber === i)
        const pageHeight = page ? page.viewport.height : 1000 // 默认预估高度

        if (accumulatedHeight + pageHeight > scrollTop) {
          startPage = Math.max(1, i - 2) // 提前2页加载
          break
        }
        accumulatedHeight += pageHeight
      }

      accumulatedHeight = 0
      for (let i = 1; i <= this.totalPages; i++) {
        const page = this.visiblePages.find(p => p.pageNumber === i)
        const pageHeight = page ? page.viewport.height : 1000

        if (accumulatedHeight > scrollTop + clientHeight) {
          endPage = Math.min(this.totalPages, i + 2) // 延后2页加载
          break
        }
        accumulatedHeight += pageHeight
      }

      this.renderQueue = []
      for (let i = startPage; i <= endPage; i++) {
        if (!this.visiblePages.some(p => p.pageNumber === i)) {
          this.renderQueue.push(i)
        }
      }

      if (this.renderQueue.length > 0) {
        this.renderPages()
      }
    },

    // 队列渲染页面
    async queueRenderPage(pageNumber) {
      if (this.isRendering || this.visiblePages.some(p => p.pageNumber === pageNumber)) return

      this.renderQueue.push(pageNumber)
      if (!this.isRendering) {
        await this.renderPages()
      }
    },

    // 执行渲染
    async renderPages() {
      this.isRendering = true
      while (this.renderQueue.length > 0) {
        const pageNum = this.renderQueue.shift()
        await this.renderPage(pageNum)
      }
      this.isRendering = false
    },

    // 渲染单个页面
    async renderPage(pageNumber) {
      try {
        // 1. 安全检查
        if (!this.$refs.container) {
          throw new Error('容器元素未找到')
        }

        // 2. 创建容器
        let wrapper = this.pageContainers.get(pageNumber)
        const isNew = !wrapper

        if (isNew) {
          wrapper = document.createElement('div')
          wrapper.className = 'pdf-page-wrapper'
          wrapper.dataset.page = pageNumber
          this.pageContainers.set(pageNumber, wrapper)

          // 3. 使用 MutationObserver 确保元素插入
          await new Promise((resolve) => {
            const observer = new MutationObserver((mutations) => {
              if (document.body.contains(wrapper)) {
                observer.disconnect()
                resolve()
              }
            })
            observer.observe(this.$refs.container, {
              childList: true,
              subtree: true
            })
            this.$refs.container.appendChild(wrapper)
          })
        }

        // 4. 安全获取 canvas
        let canvas = wrapper.querySelector('.pdf-page-canvas')
        if (!canvas) {
          canvas = document.createElement('canvas')
          wrapper.appendChild(canvas)
        }

        // 5. 延迟渲染保障
        await this.$nextTick()

        // 6. 执行渲染
        const context = canvas.getContext('2d')
        // ...剩余渲染逻辑

      } catch (err) {
        console.error(`[安全渲染] 页面 ${pageNumber} 失败:`, err)
      }
    },

    // 处理标注坐标转换
    processAnnotations(annotations, viewport) {
      return annotations.map(annot => {
        const rect = viewport.convertToViewportRectangle(annot.rect)
        return {
          ...annot,
          rect: {
            x: rect[0],
            y: viewport.height - rect[3], // 转换Y轴坐标系
            width: rect[2] - rect[0],
            height: rect[3] - rect[1]
          }
        }
      })
    },

    // 获取标注样式
    getAnnotationStyle(annot, page) {
      return {
        left: `${annot.rect.x}px`,
        top: `${annot.rect.y}px`,
        width: `${annot.rect.width}px`,
        height: `${annot.rect.height}px`,
        backgroundColor: this.getAnnotationColor(annot),
        border: annot.subtype === 'Underline' ? '2px solid blue' : 'none'
      }
    },

    // 标注颜色映射
    getAnnotationColor(annot) {
      const colors = {
        Highlight: 'rgba(255,255,0,0.3)',
        Underline: 'rgba(0,0,255,0.2)',
        StrikeOut: 'rgba(255,0,0,0.3)',
        FreeText: 'rgba(0,255,0,0.1)'
      }
      return colors[annot.subtype] || 'rgba(200,200,200,0.2)'
    },

    // 标注点击处理
    handleAnnotationClick(annot) {
      this.$emit('annotation-click', {
        type: annot.subtype,
        content: annot.contents,
        position: annot.rect
      })
    },

    // 缩放控制
    zoomIn() {
      this.scale = Math.min(3, this.scale + 0.1)
      this.reloadDocument()
    },

    zoomOut() {
      this.scale = Math.max(0.5, this.scale - 0.1)
      this.reloadDocument()
    },

    // 重新加载文档
    reloadDocument() {
      this.visiblePages = []
      this.loadDocument()
    },

    // 在组件 methods 中添加
    handleScroll() {
      this.throttleUpdate()
    },

// 函数防抖封装（300ms间隔）
    throttleUpdate() {
      if (!this.scrollTimer) {
        this.scrollTimer = setTimeout(() => {
          this.updateVisiblePages()
          this.scrollTimer = null
        }, 300)
      }
    }
  }
}
</script>

<template>
  <div class="pdf-viewer-container">
    <!-- 控制栏 -->
    <div class="pdf-controls">
      <button @click="zoomOut">-</button>
      <span>{{ currentPage }} / {{ totalPages }}</span>
      <button @click="zoomIn">+</button>
    </div>

    <!-- 页面容器 -->
    <div
        class="pdf-pages"
        @scroll="handleScroll"
        ref="container"
    >
      <div
          v-for="page in visiblePages"
          :key="page.pageNumber"
          class="pdf-page-wrapper"
          :style="{ height: page.viewport.height + 'px' }"
      >
        <canvas class="pdf-page-canvas"></canvas>
        <!-- 标注层 -->
        <div
            class="annotations-layer"
            :style="getLayerStyle(page)"
        >
          <div
              v-for="(annot, idx) in page.annotations"
              :key="idx"
              class="annotation"
              :style="getAnnotationStyle(annot, page)"
              @click="handleAnnotationClick(annot)"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.pdf-viewer-container {
  height: 90vh;
  overflow: hidden;
}

.pdf-page-canvas {
  display: block; /* 消除默认 inline 间隙 */
  width: 100% !important; /* 覆盖固有尺寸 */
  height: 100% !important;
}

.pdf-controls {
  padding: 10px;
  background: #f5f5f5;
  display: flex;
  gap: 15px;
  align-items: center;
}

/* 添加滚动优化样式 */
.pdf-pages {
  height: calc(100% - 50px);
  overflow-y: auto;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  position: relative; /* 添加定位上下文 */
}

/* 防止滚动抖动 */
.pdf-page-wrapper {
  contain: strict;
  will-change: transform;
  position: relative; /* 关键定位 */
  margin: 20px auto;
  height: 100%;
  background: white; /* 添加背景可见性检查 */
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.annotations-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  //pointer-events: none;
}

.annotation {
  position: absolute;
  cursor: pointer;
  transition: opacity 0.2s;
  pointer-events: auto;
}

.annotation:hover {
  opacity: 0.8 !important;
  z-index: 100;
}
</style>
