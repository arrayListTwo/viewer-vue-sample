<template>
  <div class="home">
    <div>
      <router-link to="/about">跳转到about页查看详情</router-link>
    </div>
    <img alt="Vue logo" src="../assets/logo.png">
    <el-button>el-button</el-button>
    <HelloWorld msg="Welcome to Your Vue.js App"/>
  </div>
</template>

<script>
// @ is an alias to /src
import HelloWorld from '@/components/HelloWorld.vue'

export default {
  name: 'HomeView',
  components: {
    HelloWorld
  }
}
</script>
