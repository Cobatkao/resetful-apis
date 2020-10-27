const Router = require('koa-router')
const jwt = require('koa-jwt')
const answerRouter = new Router({ prefix: '/api/question/:questionId/answer' })
const {  } = require('../controller/users.ctl')
const { checkAnswerExist, checkAnswerer, find, findAnswerById, create, update, delete: deleteAnswer } = require('../controller/answers.ctl')

const { secret } = require('../config/index')

const auth = jwt({ secret, passthrough:true }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

answerRouter.get('/', find)
answerRouter.get('/:id', checkAnswerExist, findAnswerById)
answerRouter.post('/', auth, create)
answerRouter.patch('/:id', auth, checkAnswerExist, checkAnswerer, update)
answerRouter.delete('/:id', auth, checkAnswerExist, checkAnswerer, deleteAnswer)

module.exports = answerRouter