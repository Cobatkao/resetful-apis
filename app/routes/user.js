const Router = require('koa-router')
const jwt = require('koa-jwt')
const userRouter = new Router({prefix: '/api/users'})
const {
  find, findById, updateUser, deleteUser,
  registerUser, login, getUserInfo,
  queryFollowing, queryFollowers, follow, unfollow,
  checkUserExist, queryLikingAnswers, likeAnswer, unLikeAnswer,
  queryDislikingAnswers, dislikeAnswer, unDislikeAnswer,
  queryCollectingAnswers, collectAnswer, unCollectAnswer
} = require('../controller/users.ctl')

const { checkAnswerExist } = require('../controller/answers.ctl')

const { secret } = require('../config/index')

const auth = jwt({ secret }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

const checkOwner = async (ctx, next) => {
  if (ctx.params.id !== ctx.state.user.id) {
    ctx.throw(403, '无权执行')
  }
  await next()
}

userRouter.get('/', find)
userRouter.get('/info', auth, getUserInfo)
userRouter.get('/:id', findById)
userRouter.patch('/:id', auth, checkOwner, updateUser)
userRouter.delete('/:id', auth, checkOwner, deleteUser)
userRouter.post('/register', registerUser)
userRouter.post('/login', login)

userRouter.put('/follow/:id', auth, checkUserExist, follow) // 关注某人
userRouter.delete('/unfollow/:id', auth, checkUserExist, unfollow) // 取关某人

userRouter.get('/:id/following', queryFollowing) // 关注列表
userRouter.get('/:id/followers', queryFollowers) // 粉丝列表

userRouter.get('/:id/likingAnswers', queryLikingAnswers) // 点赞列表
userRouter.put('/like/:id', auth, checkAnswerExist, likeAnswer, unDislikeAnswer) // 点赞某答案 vote+1
userRouter.delete('/unlike/:id', auth, checkAnswerExist, unLikeAnswer) // 取消点赞某答案 vote-1

userRouter.get('/:id/dislikingAnswers', queryDislikingAnswers) // 踩列表
userRouter.put('/dislike/:id', auth, checkAnswerExist, dislikeAnswer, unLikeAnswer) // 踩某答案
userRouter.delete('/undislike/:id', auth, checkAnswerExist, unDislikeAnswer) // 取消踩某答案

userRouter.get('/:id/collectingAnswers', checkUserExist, queryCollectingAnswers)
userRouter.put('/collectingAnswers/:id', auth, checkAnswerExist, collectAnswer)
userRouter.delete('/collectingAnswers/:id', auth, checkAnswerExist, unCollectAnswer)

module.exports = userRouter