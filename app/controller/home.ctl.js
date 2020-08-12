class HomeCtl {
  home(ctx) {
    ctx.body = '<h1>这就是主页</h1>'
  }
}

module.exports = new HomeCtl()