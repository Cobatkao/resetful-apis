const User = require('../models/users.model')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { secret, tokenExpiresTime } = require('../config/index')

class UsersCtl {

  async registerUser(ctx) { 
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      city: { type: 'string', required: false },
    })
    const { name } = ctx.request.body
    const isValidUsr = await User.findOne({ name })
    // 无重名则返回 null
    if (isValidUsr) return ctx.throw(409, '用户名已存在')
    try {
      const user = await new User(ctx.request.body).save()
      ctx.status = 200
      ctx.body = {
        message: '注册成功',
        user
      }
    } catch (error) {
      ctx.throw(500, error || error.message)
    }
  }

  async login(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true }
    })
    const { name, password } = ctx.request.body
    const db_user = await User.findOne({ name }).select('+password') // 返回需要加上password
    if (!db_user) return ctx.throw(401, '用户名错误')
    const isPasswordValid = bcrypt.compareSync(password, db_user.password) // 密码比对
    if (!isPasswordValid) return ctx.throw(401, '密码错误')
    const { _id, name: db_name } = db_user
    const token = jwt.sign({id :_id, name: db_name}, secret, { expiresIn: tokenExpiresTime }) 
    // 设置token过期时间
    // 登录成功 返回token
    ctx.body = {
      token,
      name: db_name
    }
  }

  async getUserInfo(ctx) {
    let token = ctx.header.authorization
    ctx.body = {
      token,
      data: ctx.state.user
    }
    let payload = jwt.decode(token.split(' ')[1], secret); // 手动解码
    console.log('payload', payload) // 打印token中解密的信息
  }

  async find(ctx) {
    ctx.body = await User.find({})
  }

  async findById(ctx) {
    const user = await User.findById(ctx.params.id)
    if (!user) return ctx.throw(404, '没有找到该用户')
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
    ctx.body = {
      message: '更新成功',
    }
  }

  async deleteUser(ctx) {
    const user = await User.findByIdAndRemove(ctx.params.id)
    if (!user) return ctx.status(404, '没有找到需要删除的用户')
    ctx.status = 204
  }

}

module.exports = new UsersCtl()