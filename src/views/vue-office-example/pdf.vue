<script>
import {defineComponent} from 'vue'
//引入VueOfficePdf组件
import VueOfficePdf from '@vue-office/pdf'

export default defineComponent({
  name: 'pdf',
  components: {
    VueOfficePdf
  },
  data() {
    return {
      // pdf: 'http://static.shanhuxueyuan.com/test.pdf' //设置文档地址
      pdf: '/files/测试pdf文件.pdf'
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
<div class="pdf">
  <vue-office-pdf
      :src="pdf"
      style="height: 100vh"
      @rendered="renderedHandler"
      @error="errorHandler"
  />
</div>
</template>

<style scoped lang="scss">

</style>
