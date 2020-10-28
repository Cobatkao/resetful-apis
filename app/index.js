const Koa = require('koa')
const app = new Koa()
const koaBody = require('koa-body');
const koaStatic = require('koa-static')
const error = require('koa-json-error')
const parameter = require('koa-parameter')
const mongoose = require('mongoose')
const routing = require('./routes')
const { ConnectStr } = require('./config')
const p = require('path');

mongoose.connect(ConnectStr, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(() => {
  console.log('Mongoose connection success to ' + ConnectStr);
}).catch((err) => {
  console.log('Mongoose connection error: ' + err);
})

console.log('环境变量 NODE_ENV', process.env.NODE_ENV);

app.use(koaStatic(p.join(__dirname, 'public')))
app.use(error({
  postFormat: (e, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}))
app.use(koaBody({
  multipart: true,
  formidable: {
    uploadDir: p.join(__dirname, '/public/uploads'),
    keepExtensions: true
  }
}))
app.use(parameter(app))
routing(app) // 遍历routes目录注册路由中间件

 
app.listen(3000), () => {
  console.log('server is running on Port 3000');
};