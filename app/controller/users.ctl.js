const User = require('../models/users.model')
const Question = require('../models/question.model')
const Answer = require('../models/answer.model')
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
      message: 'ok',
      result: user,
      error_info: ''
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
    await User.findById(ctx.state.user.id, 'following', async (err, rel) => {
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '关注失败',
          data: []
        }
      }
      if (!rel.following.map(id => id.toString()).includes(ctx.params.id)) {
        rel.following.push(ctx.params.id)
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
    await User.findById(ctx.state.user.id, 'following', async (err, rel) => { 
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '取关失败',
          data: []
        }
      }
      const idx = rel.following.map(id => id.toString()).indexOf(ctx.params.id)
      if (idx > -1) {
        rel.following.splice(idx, 1)
        rel.save()
        ctx.body = {
          message: 'ok',
          result: true,
          error_info: ''
        }
      } else {
        ctx.throw(403, '非法操作，没关注过')
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
    const me = await User.findById(ctx.state.user.id).select('+followingTopics')
    if (!me.followingTopics.map(id => id.toString()).includes(ctx.params.id)) {
      me.followingTopics.push(ctx.params.id)
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
    const me = await User.findById(ctx.state.user.id).select('+followingTopics')
    const idx = me.followingTopics.map(id => id.toString()).indexOf(ctx.params.id)
    if (idx > -1) {
      me.followingTopics.splice(idx, 1)
      me.save()
    } else {
      ctx.throw(401, '非法操作，未关注')
    }
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: true,
      error_info: ''
    }
  }

  async queryFollowingTopics(ctx) { 
    const user = await User.findById(ctx.params.id, 'followingTopics').populate('followingTopics')
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: user.followingTopics,
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
    const me = await User.findById(ctx.state.user.id).select('+followingQuestions')
    if (!me.followingQuestions.map(id => id.toString()).includes(ctx.params.id)) {
      me.followingQuestions.push(ctx.params.id)
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
    const me = await User.findById(ctx.state.user.id).select('+followingQuestions')
    const idx = me.followingQuestions.map(id => id.toString()).indexOf(ctx.params.id)
    if (idx > -1) {
      me.followingQuestions.splice(idx, 1)
      me.save()
    } else {
      ctx.throw(401, '非法操作，未关注')
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

  async queryLikingAnswers(ctx) { 
    const user = await User.findById(ctx.params.id, 'likingAnswers').populate('likingAnswers')
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: user.likingAnswers,
      error_info: ''
    }
  }

  async likeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user.id, 'likingAnswers')
    if (!me.likingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
      me.likingAnswers.push(ctx.params.id)
      me.save()
      await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: 1 } })
      await next()
    } else { 
      ctx.throw(403, '非法操作，重复点赞')
    }
  }

  async unLikeAnswer(ctx) { // 取消点赞
    const me = await User.findById(ctx.state.user.id, 'likingAnswers')
    const idx = me.likingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    if (idx > -1) {
      me.likingAnswers.splice(idx, 1)
      me.save(async (err) => {
        if (err) return ctx.throw(403, err)
        await Answer.findByIdAndUpdate(ctx.params.id, { $inc: { voteCount: -1 } })
      })
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        result: [],
        error_info: ''
      }
    } else { 
      ctx.throw(403, '非法操作，没赞过这个回答')
    }
    ctx.status = 204;
  }

  async queryDislikingAnswers(ctx) { 
    const user = await User.findById(ctx.params.id, 'dislikingAnswers').populate('dislikingAnswers')
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: user.dislikingAnswers,
      error_info: ''
    }
  }

  async dislikeAnswer(ctx, next) {
    const me = await User.findById(ctx.state.user.id, 'dislikingAnswers')
    if (!me.dislikingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
      me.dislikingAnswers.push(ctx.params.id)
      me.save()
      await next()
    } else { 
      ctx.throw(403, '非法操作，重复踩')
    }
  }

  async unDislikeAnswer(ctx) {
    const me = await User.findById(ctx.state.user.id, 'dislikingAnswers')
    const idx = me.dislikingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    if (idx > -1) {
      me.dislikingAnswers.splice(idx, 1)
      me.save()
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        result: [],
        error_info: ''
      }
    } else { 
      ctx.throw(403, '非法操作，没踩过这个回答')
    }
    ctx.status = 204;
  }

  async queryCollectingAnswers(ctx) { 
    const user = await User.findById(ctx.params.id, 'collectingAnswers').populate('collectingAnswers')
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      result: user.collectingAnswers,
      error_info: ''
    }
  }

  async collectAnswer(ctx) { 
    const me = await User.findById(ctx.state.user.id, 'collectingAnswers')
    if (!me.collectingAnswers.map(id => id.toString()).includes(ctx.params.id)) {
      me.collectingAnswers.push(ctx.params.id)
      me.save()
      ctx.body = {
        message: 'ok',
        result: [],
        error_info: ''
      }
    } else { 
      ctx.throw(403, '非法操作，重复收藏')
    }
  }

  async unCollectAnswer(ctx) { 
    const me = await User.findById(ctx.state.user.id, 'collectingAnswers')
    const idx = me.collectingAnswers.map(id => id.toString()).indexOf(ctx.params.id)
    if (idx > -1) {
      me.collectingAnswers.splice(idx, 1)
      me.save()
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        result: [],
        error_info: ''
      }
    } else { 
      ctx.throw(403, '非法操作，收藏中无此回答')
    }
  }

}

module.exports = new UsersCtl()