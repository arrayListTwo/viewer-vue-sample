<script>
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'vue-office-example'
})
</script>

<template>
  <div class="vue-office-example">
    <div style="background-color: darksalmon; color: #fff">
      <h2>src为 [文件地址 | 流(ArrayBuffer)]</h2>
      <h2>不支持IE</h2>
    </div>
    <nav>
      <router-link to="/vue-office/docx">docx</router-link> |
      <router-link to="/vue-office/excel">excel</router-link> |
      <router-link to="/vue-office/pdf">pdf</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<style scoped lang="scss">

</style>
