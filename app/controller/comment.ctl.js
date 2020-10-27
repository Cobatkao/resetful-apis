const Comment = require('../models/comment.model')

class CommentCtl {

  async find(ctx) { 
    const { page = 1, limit = 10, q } = ctx.query
    const skipParam = limit * (Math.max(page-0, 1) - 1)
    const limitParam = Math.max(limit - 0, 5)
    const w = new RegExp(q)
    const { answerId, questionId } = ctx.params
    const { rootCommentId } = ctx.query
    const comments = await Comment
      .find({ content: w, answerId, questionId, rootCommentId })
      .limit(limitParam)
      .skip(skipParam)
      .populate('commentator replyTo')
    ctx.body = comments
  }

  async checkCommentExist(ctx, next) {
    const comment = await Comment.findById(ctx.params.id, 'commentator questionId answerId')
    if (!comment) ctx.throw(403, '评论不存在')
    if (ctx.params.questionId && ctx.params.questionId !== comment.questionId.toString()) ctx.throw(403, '该问题下无此评论')
    if (ctx.params.answerId && ctx.params.answerId !== comment.answerId.toString()) ctx.throw(403, '该答案下无此评论')
    ctx.state.comment = comment
    await next()
  }

  async checkCommentator(ctx, next) { 
    const { comment } = ctx.state
    console.log('comment', comment);
    if (ctx.state.user.id !== comment.answerer.toString()) { 
      ctx.throw(403, '没有权限')
    }
    await next()
  }

  async findCommentById(ctx) {
    const { fields = '' } = ctx.query
    const selectedFields = fields.split(';').filter(t => t).map(t => ` +${t}`).join('')
    await Comment.findById(ctx.params.id, selectedFields, function (err, comment) {
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
        data: comment
      }
    }).populate('commentator')
  }

  async create(ctx) { 
    ctx.verifyParams({
      content: { type: 'string', required: true },
      rootCommentId: { type: 'string', required: false },
      replyTo: { type: 'string', required: false }
    })
    const comment = new Comment({
      ...ctx.request.body,
      commentator: ctx.state.user.id,
      questionId: ctx.params.questionId,
      answerId: ctx.params.answerId
    })
    await comment.save((err) => { 
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
      data: comment
    }
  }

  async update(ctx) { 
    ctx.verifyParams({
      content: { type: 'string', required: true }
    })
    const { content } = ctx.request.body // 只能更新评论内容
    await ctx.state.comment.updateOne(content, (err) => { 
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
        data: ctx.state.comment
      }
    })
  }

  async delete(ctx) { 
    await Comment.findByIdAndRemove(ctx.params.id, (err, rel) => { 
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

module.exports = new CommentCtl()