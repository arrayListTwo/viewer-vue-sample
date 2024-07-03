<template>
  <div class="about">
    <h1>This is an about page</h1>
    <div class="iframe-wrapper">
<!--      pvt=5&-->
      <iframe ref=“iframe” id="iframe" width="80%" height="860px"
              src="http://api.hidocs.cn/api?title=1&wm=内部文档，请勿外传&wmrepeat=1&furl=http://www.hidocs.cn/testfiles/hidocs%E4%BA%A7%E5%93%81%E7%99%BD%E7%9A%AE%E4%B9%A6.docx"
              frameborder="0"></iframe>
    </div>
  </div>
</template>

<script>
export default {
  name: 'About',
  mounted () {
    window.addEventListener('message', (event) => {
      // console.log('event: ', event)
      // let iframe = document.getElementById('iframe')
      // if (event.data.type == 'docHeight') {
      //   let docWidth = event.data.docWidth
      //   let rate = 1
      //   if (docWidth) {
      //     rate += (iframe.clientWidth - docWidth) / docWidth
      //   }
        // iframe.style.height = event.data.docHeight * rate + 'px'
        // iframe.style.height = event.data.docHeight + 'px'
        // iframe.style.height = Math.floor(iframe.clientWidth / event.data.docWidth * event.data.docHeight) + 'px'
        var browserHeight = window.innerHeight;
        console.log('browserHeight: ', browserHeight)
        // 将浏览器高度赋予iframe的高度
        document.getElementById('iframe').style.height = browserHeight - 40 + 'px';
      // }
    })
  }
}
</script>

<style lang="scss">
.about {
  //display: flex;
  //flex-direction: column;
  //overflow: hidden;
  //height: 100vh;
  //width: 100vw;
  //.iframe-wrapper {
  //  width: 80%;
  //  flex: 1;
  //  margin: 20px auto;
  //  overflow-y: auto;
  //}
}
</style>
