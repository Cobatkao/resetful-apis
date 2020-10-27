const Answer = require('../models/answer.model')

class AnswerCtl {

  async find(ctx) { 
    const { page = 1, limit = 10, q } = ctx.query
    const skipParam = limit * (Math.max(page-0, 1) - 1)
    const limitParam = Math.max(limit - 0, 5)
    const w = new RegExp(q)
    const answers = await Answer
      .find({ content: w, questionId: ctx.params.questionId })
      .limit(limitParam)
      .skip(skipParam)
    ctx.body = answers
  }

  async checkAnswerExist(ctx, next) {
    const answer = await Answer.findById(ctx.params.id, 'answerer questionId')
    if (!answer) ctx.throw(403, '答案不存在')
    // 只要在CRUD答案时才检查此逻辑，点赞/踩不检查
    if (ctx.params.questionId && ctx.params.questionId !== answer.questionId) ctx.throw(403, '问题下无此答案')
    ctx.state.answer = answer
    await next()
  }

  async checkAnswerer(ctx, next) { 
    const { answer } = ctx.state
    if (ctx.state.user.id !== answer.answerer.toString()) { 
      ctx.throw(403, '没有权限')
    }
    await next()
  }

  async findAnswerById(ctx) {
    const answerId = ctx.params.id
    const { fields = '' } = ctx.query
    const selectedFields = fields.split(';').filter(t => t).map(t => ` +${t}`).join('')
    await Answer.findById(answerId, selectedFields, function (err, answer) {
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '查询失败',
          data: []
        }
        return
      }
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        data: answer
      }
    }).populate('answerer')
  }

  async create(ctx) { 
    ctx.verifyParams({
      content: { type: 'string', required: true },
    })
    const answer = new Answer({
      ...ctx.request.body,
      answerer: ctx.state.user.id,
      questionId: ctx.params.questionId
    })
    await answer.save((err) => { 
      if (err) { 
        ctx.status = 404
        ctx.body = {
          message: '创建失败',
          data: []
        }
      }
    })
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      data: answer
    }
  }

  async update(ctx) { 
    ctx.verifyParams({
      content: { type: 'string', required: true },
    })
    await ctx.state.answer.updateOne(ctx.request.body, (err, rel) => { 
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: 'fail',
          data: []
        }
      }
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        data: ctx.state.answer
      }
    })
  }

  async delete(ctx) { 
    await Answer.findByIdAndRemove(ctx.params.id, (err, rel) => { 
      if (err) { 
        ctx.status = 404
        ctx.body = {
          message: 'fail',
          data: []
        }
      }
      ctx.status = 200
      ctx.body = {
        message: 'ok',
        data: rel
      }
    })
  }

}

module.exports = new AnswerCtl()