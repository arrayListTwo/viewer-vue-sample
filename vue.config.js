const { defineConfig } = require('@vue/cli-service')
module.exports = defineConfig({
  transpileDependencies: true,
  // transpileDependencies: [
  //   'pdfjs-dist'
  // ],
  publicPath: './'
})
