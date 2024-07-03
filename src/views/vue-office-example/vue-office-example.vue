<script>
import {defineComponent} from 'vue'

export default defineComponent({
  name: 'vue-office-example'
})
</script>

<template>
  <div class="vue-office-example">
    <nav>
      <router-link to="/vue-office/docx">docx</router-link> |
      <router-link to="/vue-office/excel">About</router-link> |
      <router-link to="/vue-office/pdf">vue-office库演示</router-link>
    </nav>
    <router-view></router-view>
  </div>
</template>

<style scoped lang="scss">

</style>
