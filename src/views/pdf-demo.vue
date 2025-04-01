<template>
  <div class="pdf-wrapper">
    <h1>Hello PDF</h1>
    <input type="file" @change="onFileChange"/>
    <h2 style="text-align: center">PDF预览</h2>
    <div ref="pdfContainer" class="page-container"  @mouseup="checkSelection">
      <!--      pdf渲染-->
      <canvas id="pdf-canvas" style="border: 1px solid black; direction: ltr"></canvas>
      <!--      文本渲染-->
      <div id="text-layer" ref="textLayer"></div>
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
import { PDFDocument, rgb } from "pdf-lib";
import 'pdfjs-dist/web/pdf_viewer.css' // 引入文本层样式

export default defineComponent({
  name: "pdf-demo",
  data() {
    return {
      file: null,
      pdfDoc: null,
      page: null,
      showSelectionToolbar: false,
      toolbarPosition: { left: '0', top: '0' },
      currentSelection: null,
      modifiedPdf: null, // 存储修改后的PDF
    }
  },
  async mounted() {
    this.initWorker()
  },
  methods: {
    initWorker() {
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js'
    },
    onFileChange(event) {
      this.file = event.target.files[0]
      this.$nextTick(() => {
        let blobUrl = URL.createObjectURL(this.file)
        this.loadPDF(blobUrl)
      })
    },
    async loadPDF(file) {

      try {

        // 初始化加载任务
        const loadingTask = pdfjsLib.getDocument({
          url: file,
          disableAutoFetch: true, // 优化大文件加载
          // enableTextSelection: true // 启用增强文本选择
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
        this.pdfDoc = await loadingTask.promise
        console.log(`文档包含 ${this.pdfDoc.numPages} 页`)

        // 加载第一页
        this.page = await this.pdfDoc.getPage(1)

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
        if (file) {
          URL.revokeObjectURL(file)
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

      // 创建用于收集文本节点的数组
      const textDivs = []

      // 创建文本层（新API）
      await pdfjsLib.renderTextLayer({
        textContent,
        container: textLayer,
        viewport: viewport,
        textDivs: textDivs,
        // enhanceTextSelection: true // 启用增强文本选择
      }).promise

      // 添加索引标记
      textDivs.forEach((div, index) => {
        div.dataset.textIndex = index + '' // 添加自定义属性
        div.dataset.pageNumber = page.pageNumber // 添加页码
      })

      // console.log('文本层 DOM 结构:', this.$refs.textLayer.innerHTML)
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
      console.log('e: ', e)
      const selection = window.getSelection()
      if (!selection.rangeCount || selection.toString().length <= 0) {
        this.showSelectionToolbar = false
        return
      }

      const range = selection.getRangeAt(0)
      const startNode = range.startContainer
      const endNode = range.endContainer

      // 获取 PDF.js 文本项索引
      const startIndex = parseInt(startNode.parentNode.dataset.textIndex)
      const endIndex = parseInt(endNode.parentNode.dataset.textIndex)
          + range.endOffset

      // 通过索引获取精确坐标
      const quadPoints = await this.getQuadPointsByIndex(startIndex, endIndex)

      this.currentSelection = {
        quadPoints,
        text: selection.toString()
      }

      // 计算悬浮框位置
      const rect = range.getBoundingClientRect()

      // 渲染容器的位置
      const pdfContainer = this.$refs.pdfContainer
      const pdfContainerRect = pdfContainer.getBoundingClientRect()
      console.log('选区坐标 left: ', rect.left)
      console.log('选区坐标 top: ', rect.top)
      const top = pdfContainerRect.top < 0 ? rect.bottom + Math.abs(pdfContainerRect.top) : rect.bottom - pdfContainerRect.top
      this.toolbarPosition = {
        left: `${rect.left + window.scrollX}px`,
        top: `${top}px`
      }
      this.showSelectionToolbar = true

      console.log('选区节点链:',
          Array.from(document.getSelection().anchorNode.parentNode.parentNode.children)
      )
    },

    // 坐标获取优化方法
    async getQuadPointsByIndex(startIdx, endIdx) {
      const textContent = await this.page.getTextContent()
      return textContent.items
          .slice(startIdx, endIdx)
          .map(item => [
            item.transform[4],          // x1
            item.transform[5],          // y1
            item.transform[4] + item.width, // x2
            item.transform[5] - item.height // y2
          ])
    },

    // 查找PDF文本节点
    findTextNode(node) {
      // 向上查找包含 data-page-number 属性的元素
      while (node && node !== document.body) {
        if (node.dataset?.pageNumber) {
          return node
        }
        node = node.parentNode
      }
      return null
    },

    // 获取选中区域的四边形坐标（核心）
    async getSelectedQuadPoints(range) {
      const startSpan = range.startContainer.parentNode
      const endSpan = range.endContainer.parentNode

      // 通过 data 属性获取索引
      const startIdx = parseInt(startSpan.dataset.textIndex)
      const endIdx = parseInt(endSpan.dataset.textIndex) + range.endOffset

      // 获取对应文本项
      const textContent = await this.page.getTextContent()
      return textContent.items
          .slice(startIdx, endIdx)
          .map(item => [
            item.transform[4],          // x1
            item.transform[5],          // y1
            item.transform[4] + item.width, // x2
            item.transform[5] - item.height // y2
          ])
    },

    // 创建高亮标注
    async createHighlight() {

      // 1、从file对象获取原始PDF字节
      const existingPdfBytes = await this.file.arrayBuffer()

      // 2、使用pdf-lib加载并修改
      const pdfLibDoc = await PDFDocument.load(existingPdfBytes)

      if (!pdfLibDoc || !this.currentSelection) return

      const page = pdfLibDoc.getPage(this.page.pageNumber - 1)

      const { quadPoints, text } = this.currentSelection

      // 转换坐标系（关键！）
      const pageHeight = page.getHeight()
      const convertedQuads = this.convertCoordinates(quadPoints, pageHeight)

      // 创建高亮注释
      page.addAnnotation({
        subtype: 'Highlight',
        rect: this.calcAnnotationRect(convertedQuads),
        quadPoints: convertedQuads.flat(),
        color: rgb(1, 1, 0), // 黄色
        contents: text
      })

      // 4. 保存修改后的PDF
      const modifiedBytes = await pdfLibDoc.save()
      this.modifiedPdf = URL.createObjectURL(
          new Blob([modifiedBytes], { type: 'application/pdf' })
      )

      // 5. 重新加载修改后的PDF
      await this.loadModifiedPdf()
    },

    // 坐标转换（pdf.js → pdf-lib）
    convertCoordinates(quadPoints, pageHeight) {
      return quadPoints.map(([x1, y1, x2, y2]) => [
        x1,
        pageHeight - y2, // Y轴翻转
        x2,
        pageHeight - y1  // Y轴翻转并交换上下坐标
      ])
    },

    // 计算注释边界框
    calcAnnotationRect(convertedQuads) {
      const xs = convertedQuads.flatMap(([x1, _, x2]) => [x1, x2])
      const ys = convertedQuads.flatMap(([_, y1, __, y2]) => [y1, y2])

      return [
        Math.min(...xs),
        Math.min(...ys),
        Math.max(...xs),
        Math.max(...ys)
      ]
    },

    async loadModifiedPdf() {
      // 销毁旧PDF实例
      if (this.pdfDoc) {
        this.pdfDoc.destroy()
      }

      // 使用PDF.js加载新PDF
      const loadingTask = pdfjsLib.getDocument({
        url: this.modifiedPdf,
        enableXfa: true
      })

      this.pdfDoc = await loadingTask.promise
      this.currentPage = await this.pdfDoc.getPage(1)
      await this.renderPage(this.modifiedPdf)
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
    },

    createUnderline(){}
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

/* 文本选中悬浮框 */
.selection-toolbar {
  position: absolute;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  border-radius: 4px;
  padding: 4px;
  z-index: 9999;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;

  button {
    padding: 4px 8px;
    border: 1px solid #ddd;
    border-radius: 2px;
    background: #f8f8f8;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background: #eee;
      border-color: #ccc;
    }
  }
}

/* 增强文本选择体验 */
::selection {
  background: rgba(255,255,0,0.3);
}
</style>
