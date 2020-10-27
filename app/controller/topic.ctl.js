const Topic = require('../models/topic.model')
const Question = require('../models/question.model')

class TopicsCtl {
  
  async checkTopicExist(ctx, next) {
    const topic = await Topic.findById(ctx.params.id)
    if (!topic) ctx.throw(404, '不存在该话题')
    await next()
  }

  async find(ctx) { 
    const { page = 1, limit = 10, q } = ctx.query
    const skipParam = limit * (Math.max(page-0, 1) - 1)
    const limitParam = Math.max(limit - 0, 5)
    const topics = await Topic.find({ name: new RegExp(q) }).limit(limitParam).skip(skipParam)
    ctx.body = topics
  }

  async findTopicById(ctx) {
    const topicId = ctx.params.id
    const { fields = '' } = ctx.query
    const selectedFields = fields.split(';').filter(t => t).map(t => ` +${t}`).join('')
    await Topic.findById(topicId, selectedFields, function (err, topic) {
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '查询失败',
          data: []
        }
      }
      ctx.body = {
        message: 'ok',
        data: topic
      }
    })
  }

  async createTopic(ctx) { 
    ctx.verifyParams({
      name: { type: 'string', required: true },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false }
    })
    const topic = new Topic(ctx.request.body)
    await topic.save((err) => { 
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
      data: topic
    }
  }

  async updateTopic(ctx) { 
    ctx.verifyParams({
      name: { type: 'string', required: false },
      avatar_url: { type: 'string', required: false },
      introduction: { type: 'string', required: false }
    })
    const topicId = ctx.params.id
    await Topic.findByIdAndUpdate(topicId, ctx.request.body, (err, topic) => { 
      if (err) {
        ctx.status = 404
        ctx.body = {
          message: '更新失败',
          data: []
        }
      }
      ctx.body = {
        message: 'ok',
        data: topic
      }
    })
  }

  async deleteTopic(ctx) { 
    const topicId = ctx.params.id
    await Topic.findByIdAndRemove(topicId, (err, result) => { 
      if (err) { 
        ctx.throw(404, '删除失败')
      }
      ctx.body = {
        message: 'ok',
        data: result
      }
    })
  }

  async queryQuestions(ctx) { 
    const questions = await Question.find({ topics: ctx.params.id })
    ctx.status = 200
    ctx.body = {
      message: 'ok',
      data: questions
    }
  }

}

module.exports = new TopicsCtl()