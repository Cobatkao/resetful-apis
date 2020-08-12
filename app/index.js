const Koa = require('koa')
const app = new Koa()
const bodyParser = require('koa-bodyparser');
const error = require('koa-json-error')
const parameter = require('koa-parameter')
const mongoose = require('mongoose')
const routing = require('./routes')
const { ConnectStr } = require('./config')

mongoose.connect(ConnectStr, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
}).then(() => {
  console.log('Mongoose connection success to ' + ConnectStr);
}).catch((err) => {
  console.log('Mongoose connection error: ' + err);
})

app.use(error({
  postFormat: (e, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}))
app.use(bodyParser())
app.use(parameter(app))
routing(app) // 遍历routes目录注册路由中间件

 
app.listen(8888), () => {
  console.log('server is running on Port 8888');
};