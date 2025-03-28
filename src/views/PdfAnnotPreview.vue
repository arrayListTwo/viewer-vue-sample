<template>
  <div>
    <canvas ref="pdfCanvas"></canvas>
  </div>
</template>

<script>
import pdfjsLib from 'pdf-lib';
import { getDocument } from 'pdfjs-dist';
import 'pdfjs-dist/web/pdf_viewer.css';

export default {
  name: 'PdfAnnotPreview',
  data() {
    return {
      pdf: null,
      pageNumber: 1,
    };
  },
  mounted() {
    this.loadPDF();
  },
  methods: {
    async loadPDF() {
      try {
        // 使用 pdfjs-dist 加载 PDF 文件
        const loadingTask = getDocument('/files/测试pdf文件.pdf');
        this.pdf = await loadingTask.promise;
        this.renderPage();

        // 使用 pdf-lib 处理标注信息（示例）
        const pdfBytes = await fetch('/files/测试pdf文件.pdf').then(res => res.arrayBuffer());
        const pdfDoc = await pdfjsLib.PDFDocument.load(pdfBytes);
        const page = pdfDoc.getPage(0); // 获取第一页
        // 这里可以添加更多处理标注的逻辑，例如读取标注内容等
        console.log('PDF 标注信息:', page.getAnnotations());
      } catch (error) {
        console.error('加载 PDF 时出错:', error);
      }
    },
    async renderPage() {
      try {
        const page = await this.pdf.getPage(this.pageNumber);
        const canvas = this.$refs.pdfCanvas;
        const context = canvas.getContext('2d');

        const viewport = page.getViewport({ scale: 1.0 });
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        await page.render(renderContext).promise;
      } catch (error) {
        console.error('渲染 PDF 页面时出错:', error);
      }
    },
  },
};
</script>
