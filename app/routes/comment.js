const Router = require('koa-router')
const jwt = require('koa-jwt')
const commentRouter = new Router({
  prefix: '/api/question/:questionId/answer/:answerId/comments'
})
const {  } = require('../controller/users.ctl')
const { checkCommentExist, checkCommentator, find, findCommentById, create, update, delete: deleteComment } = require('../controller/comment.ctl')

const { secret } = require('../config/index')

const auth = jwt({ secret }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

commentRouter.get('/', find)
commentRouter.get('/:id', checkCommentExist, findCommentById)
commentRouter.post('/', auth, create)
commentRouter.patch('/:id', auth, checkCommentExist, checkCommentator,  update)
commentRouter.delete('/:id', auth, checkCommentExist, checkCommentator, deleteComment)

module.exports = commentRouter