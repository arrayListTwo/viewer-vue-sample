<script>
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'vue-office-example'
})
</script>

<template>
  <div class="vue-office-example">
    <h2 style="background-color: darksalmon; color: #fff">src为 [文件地址 | 流(ArrayBuffer)]</h2>
    <nav>
      <router-link to="/vue-office/docx">docx</router-link> |
      <router-link to="/vue-office/xlsx">xlsx</router-link> |
      <router-link to="/vue-office/pdf">vue-office库演示</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<style scoped lang="scss">

</style>
