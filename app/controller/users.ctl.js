const User = require('../models/users.model')
const Question = require('../models/question.model')
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
      ctx.body = user
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
    // let payload = jwt.decode(token.split(' ')[1], secret); // 手动解码
    // console.log('payload', payload) // 打印token中解密的信息
  }

  async find(ctx) {
    const { page = 1, limit = 10, q } = ctx.query
    const skipParam = limit * (Math.max(page-0, 1) - 1)
    const limitParam = Math.max(limit-0, 10)
    ctx.body = await User.find({ name: new RegExp(q) }).limit(limitParam).skip(skipParam)
  }

  async findById(ctx) {
    const { fields = '' } = ctx.query
    const selectedFields = fields.split(';').filter(f => f).map(f => ' +' + f).join('') // 自动过滤字段
    const populateStr = fields.split(';').filter(f => f).map(f => { 
      if (f === 'educations') { 
        return 'educations.school educations.major'
      }
      if (f === 'employments') { 
        return 'employments.company employments.position'
      }
      return f
    }).join(' ')
    console.log(populateStr);
    const user = await User.findById(ctx.params.id)
      .select(selectedFields)
      .populate(populateStr)
    if (!user) return ctx.throw(404, '没有找到该用户')
    ctx.body = user
  }

  async updateUser(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: false },
      password: { type: 'string', required: false },
      city: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      gender: { type: 'string', required: false },
      headline: { type: 'string', required: false },
      residence: { type: 'array', itemType: 'string', required: false },
      business: { type: 'string', required: false },
      employments: { type: 'array', itemType: 'object', required: false },
      educations: { type: 'array', itemType: 'object', required: false },
    })
    await User.findByIdAndUpdate(ctx.params.id, ctx.request.body, (err, user) => { 
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '更新失败',
          data: []
        }
      }
      ctx.body = {
        message: 'ok',
        data: user
      }
    })
  }

  async deleteUser(ctx) {
    await User.findByIdAndRemove(ctx.params.id, (err, rel) => { 
      if (err) { 
        ctx.status = 404
        ctx.body = {
          message: 'fail',
          data: []
        }
      }
      ctx.status = 204
        ctx.body = {
          message: 'ok',
          data: rel
        }
    })
  }

  async checkUserExist(ctx, next) {
    const user = await User.findById(ctx.params.id)
    if (!user) ctx.throw(404, '用户不存在')
    await next()
  }

  async follow(ctx) {
    const target = ctx.params.id
    await User.findById(ctx.state.user.id, 'following', async (err, rel) => {
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '关注失败',
          data: []
        }
      }
      if (!rel.following.map(id => id.toString()).includes(target)) {
        rel.following.push(target)
        rel.save()
        ctx.body = {
          message: 'ok',
          result: true,
          error_info: ''
        }
      } else {
        ctx.status = 401
        ctx.body = {
          message: 'fail',
          reason: '重复关注',
          data: []
        }
      }
    })
  }

  async unfollow(ctx) {
    const target = ctx.params.id
    await User.findById(ctx.state.user.id, 'following', async (err, rel) => { 
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '取关失败',
          data: []
        }
      }
      const idx = rel.following.map(id => id.toString()).indexOf(target)
      if (idx > -1) {
        rel.following.splice(idx, 1)
        rel.save()
        ctx.body = {
          message: 'ok',
          result: true,
          error_info: ''
        }
      } else {
        ctx.status = 401
        ctx.body = {
          message: 'fail',
          reason: '并未关注',
          data: []
        }
      }
    })
  }

  async queryFollowing(ctx) {
    const rel = await User.findById(ctx.params.id)
      .select('+following')
      .populate('following')
    if (rel && rel.following) {
      ctx.status = 200
      ctx.body = {
        code: 200,
        message: 'ok',
        data: rel.following
      }
    } else { 
      ctx.status = 401
      ctx.body = {
        code: 401,
        message: 'fail',
      }
    }
  }

  async queryFollowers(ctx) {
    await User.find({ following: ctx.params.id }, (err, users) => { 
      if (err) {
        ctx.status = 401
        ctx.body = {
          code: 401,
          message: 'fail',
          data: []
        }
      } else { 
        ctx.status = 200
        ctx.body = {
          code: 200,
          message: 'ok',
          data: users
        }
      }
    })
  }

  async followTopic(ctx) {
    const target = ctx.params.id
    const me = await User.findById(ctx.state.user.id).select('+followingTopics')
    if (!me.followingTopics.map(id => id.toString()).includes(target)) {
      me.followingTopics.push(target)
      me.save()
    } else {
      ctx.throw(401, '关注错误，重复关注')
    }
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: true,
      error_info: ''
    }
  }

  async unfollowTopic(ctx) {
    const target = ctx.params.id
    const me = await User.findById(ctx.state.user.id).select('+followingTopics')
    const idx = me.followingTopics.map(id => id.toString()).indexOf(target)
    if (idx > -1) {
      me.followingTopics.splice(idx, 1)
      me.save()
    } else {
      ctx.throw(401, '取关错误，未关注')
    }
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: true,
      error_info: ''
    }
  }

  async queryFollowingTopics(ctx) { 
    const topics = await User.findById(ctx.params.id, 'followingTopics').populate('followingTopics')
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: topics.followingTopics,
      error_info: ''
    }
  }

  async queryTopicFollowers(ctx) { 
    const users = await User.find({ followingTopics: ctx.params.id })
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: users,
      error_info: ''
    }
  }

  async followQuestion(ctx) {
    const target = ctx.params.id
    const me = await User.findById(ctx.state.user.id).select('+followingQuestions')
    if (!me.followingQuestions.map(id => id.toString()).includes(target)) {
      me.followingQuestions.push(target)
      me.save()
    } else {
      ctx.throw(401, '关注错误，重复关注')
    }
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: true,
      error_info: ''
    }
  }

  async unfollowQuestion(ctx) {
    const target = ctx.params.id
    const me = await User.findById(ctx.state.user.id).select('+followingQuestions')
    const idx = me.followingQuestions.map(id => id.toString()).indexOf(target)
    if (idx > -1) {
      me.followingQuestions.splice(idx, 1)
      me.save()
    } else {
      ctx.throw(401, '取关错误，未关注')
    }
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: true,
      error_info: ''
    }
  }

  /**
   * 用户的问题列表
   * @param {*} ctx 
   */
  async queryQuestionList(ctx) { 
    await Question.find({ questioner: ctx.params.id }, (err, users) => { 
      if (err) {
        ctx.status = 401
        ctx.body = {
          code: 401,
          message: 'fail',
          data: []
        }
      } else { 
        ctx.status = 200
        ctx.body = {
          code: 200,
          message: 'ok',
          data: users
        }
      }
    })
  }

}

module.exports = new UsersCtl()