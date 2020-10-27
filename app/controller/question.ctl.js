const Question = require('../models/question.model')

class QuestionCtl {
  
  async checkQuestionExist(ctx, next) {
    const question = await Question.findById(ctx.params.id, 'questioner')
    if (!question) ctx.throw(403, '问题不存在')
    ctx.state.question = question
    await next()
  }

  async checkQuestioner(ctx, next) { 
    const { question } = ctx.state
    if (ctx.state.user.id !== question.questioner.toString()) { 
      ctx.throw(403, '没有权限')
    }
    await next()
  }

  async find(ctx) { 
    const { page = 1, limit = 10, q } = ctx.query
    const skipParam = limit * (Math.max(page-0, 1) - 1)
    const limitParam = Math.max(limit - 0, 5)
    const w = new RegExp(q)
    const topics = await Question
      .find({ $or: [{ title: w }, { description: q }] })
      .limit(limitParam)
      .skip(skipParam)
      .populate('questioner')
    ctx.body = topics
  }

  async findQuestionById(ctx) {
    const questionId = ctx.params.id
    const { fields = '' } = ctx.query
    const selectedFields = fields.split(';').filter(t => t).map(t => ` +${t}`).join('')
    await Question.findById(questionId, selectedFields, function (err, question) {
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
        data: question
      }
    }).populate('questioner topics')
  }

  async create(ctx) { 
    ctx.verifyParams({
      title: { type: 'string', required: true },
      description: { type: 'string', required: false }
    })
    const question = new Question({...ctx.request.body, questioner: ctx.state.user.id})
    await question.save((err) => { 
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
      data: question
    }
  }

  async update(ctx) { 
    ctx.verifyParams({
      title: { type: 'string', required: false },
      description: { type: 'string', required: false },
    })
    await ctx.state.question.updateOne(ctx.request.body, (err, rel) => { 
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
        data: ctx.state.question
      }
    })
  }

  async delete(ctx) { 
    await Question.findByIdAndRemove(ctx.params.id, (err, rel) => { 
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

module.exports = new QuestionCtl()