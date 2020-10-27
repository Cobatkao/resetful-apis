const Router = require('koa-router')
const jwt = require('koa-jwt')
const questionRouter = new Router({ prefix: '/api/question' })
const { queryQuestionList, checkUserExist, unfollowQuestion, followQuestion } = require('../controller/users.ctl')
const { checkQuestionExist, checkQuestioner, find, findQuestionById, create, update, delete: deleteQuestion } = require('../controller/question.ctl')

const { secret } = require('../config/index')

const auth = jwt({ secret }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

questionRouter.get('/', find)
questionRouter.get('/:id', checkQuestionExist, findQuestionById)
questionRouter.post('/', auth, create)
questionRouter.patch('/:id', auth, checkQuestionExist, checkQuestioner, update)
questionRouter.delete('/:id', auth, checkQuestionExist, checkQuestioner, deleteQuestion)

questionRouter.put('/follow/:id', auth, checkQuestionExist, followQuestion) // 关注某问题
questionRouter.delete('/unfollow/:id', auth, checkQuestionExist, unfollowQuestion) // 取关某问题

questionRouter.get('/:id/questions', checkUserExist, queryQuestionList)


module.exports = questionRouter