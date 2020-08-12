const User = require('../models/users')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { secret } = require('../config/index')

class UsersCtl {

  async find(ctx) {
    ctx.body = await User.find({})
  }

  async findById(ctx) {
    const user = await User.findById(ctx.params.id)
    if (!user) return ctx.throw(404, '没有找到该用户')
    ctx.body = user
  }

  async createUser(ctx) { 
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      city: { type: 'string', required: false },
    })
    const { name } = ctx.request.body
    const isValidUsr = await User.findOne({ name })
    if (isValidUsr) return ctx.throw(409, '该用户名已被占用，在想一个吧')
    const user = await new User(ctx.request.body).save()
    ctx.body = user
  }

  async updateUser(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: false },
      password: { type: 'string', required: false },
      city: { type: 'string', required: false },
    })
    const user = await User.findByIdAndUpdate(ctx.params.id, ctx.request.body)
    if (!user) return ctx.throw(404, '没有找到需要更新的用户')
    ctx.body = user
  }

  async deleteUser(ctx) {
    const user = await User.findByIdAndRemove(ctx.params.id)
    if (!user) return ctx.status(404, '没有找到需要删除的用户')
    ctx.status = 204
  }

  async login(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true }
    })
    const { name, password } = ctx.request.body
    const db_user = await User.findOne({ name }).select('+password')
    if (!db_user) return ctx.throw(401, '用户名错误')
    const isPasswordValid = bcrypt.compareSync(password, db_user.password)
    if (!isPasswordValid) return ctx.throw(401, '密码错误')
    const { _id, name: db_name } = db_user
    const token = jwt.sign({_id, db_name}, secret, { expiresIn: '1d' }) // 设置token过期时间
    // 登录成功 返回token
    ctx.body = {
      token,
      name: db_name
    }
  }
}

module.exports = new UsersCtl()