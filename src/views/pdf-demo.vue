<template>
  <div class="pdf-wrapper">
    <h1>Hello PDF</h1>
    <input type="file" @change="onFileChange"/>
    <h2 style="text-align: center">PDF预览</h2>
    <div class="page-container"  @mouseup="checkSelection">
      <!--      pdf渲染-->
      <canvas id="pdf-canvas" style="border: 1px solid black; direction: ltr"></canvas>
      <!--      文本渲染-->
      <div id="text-layer"></div>
      <!--      标注渲染-->
      <div id="annotationLayer" class="annotation-layer"></div>
      <!-- 文本选中悬浮框 -->
      <div v-if="showSelectionToolbar"
           class="selection-toolbar"
           :style="toolbarPosition">
        <button @click="createHighlight">高亮</button>
        <button @click="createUnderline">下划线</button>
      </div>
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
      file: null,
      page: null,
      showSelectionToolbar: false,
      toolbarPosition: { left: '0', top: '0' },
      currentSelection: null
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
        this.page = await pdf.getPage(1)

        // 计算视口
        const viewport = this.page.getViewport({
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
        await this.page.render(renderContext).promise
        console.log('页面渲染完成')

        // 添加文本层
        await this.renderTextLayer(this.page, viewport)

        // 渲染标注
        await this.renderAnnotations(this.page)

      } catch (e) {
        console.error('加载PDF文件失败:', e)
      } finally {
        // 释放 URL
        if (blobUrl) {
          URL.revokeObjectURL(blobUrl)
        }
      }
    },

    // 添加文本层
    async renderTextLayer(page, viewport) {
      console.log('渲染文本层')
      console.log(page, viewport)
      const textLayer = document.getElementById('text-layer')
      textLayer.innerHTML = ''
      // 关键修复：设置CSS变量
      textLayer.style.setProperty('--scale-factor', viewport.scale)

      const textContent = await page.getTextContent()

      // 创建文本层（新API）
      await pdfjsLib.renderTextLayer({
        textContent: textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: []
      })
    },

    // 渲染标注
    async renderAnnotations(page) {

      const viewport = page.getViewport({
        scale: 1.5,
        rotation: 0  // 支持页面旋转
      })

      const annotationLayer = document.getElementById('annotationLayer')

      // 获取标注列表
      const annotations = await page.getAnnotations()

      // 清空旧内容
      annotationLayer.innerHTML = ''

      // // 使用官方API渲染注释层
      // await pdfjsLib.AnnotationLayer.render({
      //   viewport: viewport,
      //   div: annotationLayer,
      //   annotations: await page.getAnnotations(),
      //   page: page,
      //   renderInteractiveForms: true
      // })

      annotations.forEach(annotation => {
        console.log(JSON.stringify(annotation, 2));
        this.renderSingleAnnotation(annotation, viewport, annotationLayer)
      })
    },

    renderSingleAnnotation(annotation, viewport, container) {

      // 逃过隐藏注释
      if (annotation.viewable === false) return

      // 转换坐标到视口坐标系
      const rect = pdfjsLib.Util.normalizeRect(annotation.rect) // 原始PDF坐标
      const transformedRect = viewport.convertToViewportRectangle(rect) // 视口转换后坐标
      // 计算屏幕坐标系位置（Y轴翻转）
      const [x1, y1, x2, y2] = transformedRect
      const width = x2 - x1
      const height = y1 -y2

      // 创建注释容器
      const div = document.createElement('div')
      div.className = 'pdf-annotation'
      div.style.position = 'absolute'

      // 设置位置和尺寸
      div.style.left = `${x1}px`
      div.style.top = `${y2}px` // PDF坐标系转换为屏幕坐标系
      div.style.width = `${width}px`
      div.style.height = `${height}px`
      // 添加变换补偿（处理旋转和缩放）
      // div.style.transform = `matrix(${viewport.transform.join(',')})`


      // 根据注释类型添加样式
      switch (annotation.subtype) {
        case 'Highlight':
          // div.style.backgroundColor = 'rgba(255,0,59,0.8)'
          div.classList.add('highlight-annotation')
          this.renderTextAnnotation(div, annotation)
          break
        case 'Underline':
          div.style.borderBottom = '2px solid rgba(255, 0, 0, 0.6)'
          break
        case 'Text':
          this.renderTextAnnotation(div, annotation)
          break
          // 添加其他类型处理...
      }
      container.appendChild(div)
    },

    renderTextAnnotation(container, annotation) {

      // 创建文本注释图标
      // const icon = document.createElement('div')
      container.className = 'text-annotation-icon'
      // icon.innerHTML = '💬'

      // 创建弹出内容
      const popup = document.createElement('div')
      popup.className = 'annotation-popup'
      popup.textContent = annotation.contentsObj.str || ''

      // 交互逻辑
      container.addEventListener('click', () => {
        popup.style.display = popup.style.display === 'block' ? 'none' : 'block'
      })

      // icon.addEventListener('mouseout', () => {
      //   popup.style.display = 'none'
      // })

      // container.appendChild(icon)
      container.appendChild(popup)
    },

    // 检测文本选择
    async checkSelection(e) {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed) {
        this.showSelectionToolbar = false
        return
      }

      // 获取PDF.js的文本节点信息
      const range = selection.getRangeAt(0)
      const startNode = this.findTextNode(range.startContainer)
      const endNode = this.findTextNode(range.endContainer)

      if (!startNode || !endNode) return

      // 获取选中文本的坐标信息
      const textContent = await this.page.getTextContent()
      const quadPoints = await this.getSelectedQuadPoints(
          range,
          textContent
      )

      this.currentSelection = {
        quadPoints,
        text: selection.toString()
      }

      // 计算悬浮框位置
      const rect = range.getBoundingClientRect()
      this.toolbarPosition = {
        left: `${rect.left + window.scrollX}px`,
        top: `${rect.top + window.scrollY - 40}px`
      }
      this.showSelectionToolbar = true
    },

    // 查找PDF文本节点
    findTextNode(node) {
      while (node && !node.classList?.contains('text-layer')) {
        node = node.parentNode
      }
      debugger
      return node?.dataset?.fontName ? node : null
    },

    // 获取选中区域的四边形坐标（核心）
    async getSelectedQuadPoints(range, textContent) {
      const startNode = range.startContainer.parentNode
      const endNode = range.endContainer.parentNode

      // 获取起始字符索引
      const startIdx = parseInt(startNode.dataset.geIdx)
      const endIdx = parseInt(endNode.dataset.geIdx)
          + range.endOffset

      // 生成四边形坐标
      return textContent.items
          .slice(startIdx, endIdx + 1)
          .flatMap(item => item.transform)
    },

    // 创建高亮标注
    async createHighlight() {
      const annotation = {
        subtype: 'Highlight',
        quadPoints: this.currentSelection.quadPoints,
        color: [1, 1, 0], // 黄色
        contents: this.currentSelection.text
      }

      // 添加到PDF文档
      const annotationRef = await this.pdfDoc.context.createObject({
        Type: 'Annot',
        Subtype: 'Highlight',
        QuadPoints: this.normalizeQuadPoints(annotation.quadPoints),
        Rect: this.calculateAnnotationRect(annotation.quadPoints),
        Contents: annotation.contents,
        Color: annotation.color
      })

      // 更新渲染
      this.page.annotations.push(annotationRef)
      await this.renderAnnotations(this.page)
      this.showSelectionToolbar = false
    },

    // 坐标归一化处理
    normalizeQuadPoints(points) {
      return points.map((val, idx) =>
          idx % 2 === 1 ? this.viewport.height - val : val
      )
    },

    // 计算标注的边界矩形
    calculateAnnotationRect(quadPoints) {
      const xs = []
      const ys = []

      for (let i = 0; i < quadPoints.length; i += 2) {
        xs.push(quadPoints[i])
        ys.push(quadPoints[i + 1])
      }

      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys)
      ]
    },

    // 四边形坐标转换（适配PDF坐标系）
    transformQuadPoints(quadPoints) {
      const viewport = this.viewport
      return quadPoints.map((val, idx) => {
        return idx % 2 === 0
            ? val / viewport.scale
            : (viewport.height - val) / viewport.scale
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

.annotation-layer {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none; /* 允许交互 */
  width: 100%;
  height: 100%;
  /* 处理PDF旋转 */
  transform-origin: 0 0;
}

/* 修正链接注释位置 */
.annotation-layer .linkAnnotation {
  position: absolute;
  transform-origin: 0 0;
}

/* 高亮标注 */
/*.highlight-annotation {
  mix-blend-mode: multiply; !* 实现类似PDF的高亮效果 *!
}*/

/* 文本注释 */
.text-annotation-icon {
  pointer-events: auto;
  cursor: pointer;
  font-size: 20px;
  position: absolute;
  left: 0;
  top: 0;
}

.annotation-popup {
  display: none;
  position: absolute;
  left: 24px;
  top: 0;
  background: #b6ece8;
  border: 1px solid #ccc;
  padding: 8px;
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
  min-width: 200px;
  z-index: 100;
}
</style>
