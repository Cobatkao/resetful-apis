const Router = require('koa-router')
const router = new Router()
const { home } = require('../controller/home.ctl')

router.get('/', home)

module.exports = router