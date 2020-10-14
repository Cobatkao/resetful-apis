const Router = require('koa-router')
const jwt = require('koa-jwt')
const userRouter = new Router({prefix: '/api/users'})
const { find, findById, updateUser, deleteUser, registerUser, login, getUserInfo, queryFollowing } = require('../controller/users.ctl')
const { secret } = require('../config/index')

const auth = jwt({ secret, passthrough:true }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

const checkOwner = async (ctx, next) => {
  // ctx.params.id 和 ctx.request.id 二者相同
  if (ctx.request.id !== ctx.state.user._id) {
    ctx.throw(403, '无权执行')
  }
  await next()
}

userRouter.get('/', find)

userRouter.get('/info', auth, getUserInfo)

userRouter.get('/:id', findById)

userRouter.patch('/:id', auth, checkOwner, updateUser)

userRouter.delete('/:id', auth, checkOwner, deleteUser)

userRouter.post('/register', registerUser)

userRouter.post('/login', login)

userRouter.get('/:id/follow', queryFollowing)

module.exports = userRouter