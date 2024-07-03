<script>
import {defineComponent} from 'vue'
//引入VueOfficeDocx组件
import VueOfficeDocx from '@vue-office/docx'
//引入相关样式
import '@vue-office/docx/lib/index.css'

export default defineComponent({
  name: 'docx',
  components: {
    VueOfficeDocx
  },
  data() {
    return {
      // docx: 'http://static.shanhuxueyuan.com/test6.docx' //设置文档网络地址，可以是相对地址
      docx: '/files/测试word-docx格式.docx'
    }
  },
  methods: {
    renderedHandler() {
      console.log("渲染完成")
    },
    errorHandler() {
      console.log("渲染失败")
    }
  }
})
</script>

<template>
  <div class="docx">
    <h2>只支持.docx文件</h2>
    <vue-office-docx
        :src="docx"
        style="height: 100vh;"
        @rendered="renderedHandler"
        @error="errorHandler"
    />
  </div>
</template>

<style scoped lang="scss">

</style>
