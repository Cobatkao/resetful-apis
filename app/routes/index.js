const fs = require('fs')
const path = require('path')

module.exports = app => {
  fs.readdirSync(__dirname).forEach((item) => {
    if (item.includes('index.js')) return
    const route = path.resolve(__dirname, item);
    app.use(require(route).routes()).use(require(route).allowedMethods())
  })
}