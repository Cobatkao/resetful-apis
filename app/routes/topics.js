const Router = require('koa-router')
const jwt = require('koa-jwt')
const topicRouter = new Router({ prefix: '/api/topics' })
const { queryTopicFollowers, queryFollowingTopics, checkUserExist, unfollowTopic, followTopic } = require('../controller/users.ctl')
const { createTopic, deleteTopic, updateTopic, find, findTopicById, checkTopicExist } = require('../controller/topic.ctl')

const { secret } = require('../config/index')

const auth = jwt({ secret, passthrough:true }).unless({ path: [/\/login/, /\/register/] }) // 默认解码后的数据在 ctx.state.user

topicRouter.get('/', find)
topicRouter.get('/:id', checkTopicExist, findTopicById)
topicRouter.post('/', auth, createTopic)
topicRouter.delete('/:id', auth, checkTopicExist, deleteTopic)
topicRouter.patch('/:id', auth, checkTopicExist, updateTopic)

topicRouter.put('/follow/:id', auth, checkTopicExist, followTopic) // 关注某话题
topicRouter.delete('/unfollow/:id', auth, checkTopicExist, unfollowTopic) // 取关某话题

topicRouter.get('/:id/followers', auth, checkTopicExist, queryTopicFollowers) // 获取某个话题下的关注者列表
topicRouter.get('/:id/following', auth, checkUserExist, queryFollowingTopics) // 获取某个用户的关注话题列表

module.exports = topicRouter