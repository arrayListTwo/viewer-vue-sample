<template>
  <div class="home">
    <div style="text-align: center">
      <router-link to="/usdoc">跳转到 【usdoc服务演示】 页查看详情</router-link>
    </div>
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
