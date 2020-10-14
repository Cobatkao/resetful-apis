const p = require('path')

class HomeCtl {
  home(ctx) {
    ctx.body = '<h1>这就是主页</h1>'
  }
  upload(ctx) {
    const file = ctx.request.files.file
    const basename = p.basename(file.path)
    ctx.body = {
      url: `${ctx.request.origin}/uploads/${basename}`
    }
  }
}

module.exports = new HomeCtl()