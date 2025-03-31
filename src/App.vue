<template>
  <div id="app">
    <nav>
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link> |
      <router-link to="/PdfAnnotPreview">PdfAnnotPreview</router-link> |
      <router-link to="/PdfView">PdfView</router-link> |
      <router-link to="/pdfjs">pdfjs</router-link> |
      <router-link to="/PDFDemo">PDFDemo</router-link>
    </nav>
    <router-view/>
  </div>
</template>

<script>
import HelloWorld from './components/HelloWorld.vue'

export default {
  name: 'app',
  components: {
    HelloWorld
  }
}
</script>

<style>
</style>
