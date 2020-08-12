const Router = require('koa-router')
const userRouter = new Router({prefix: '/users'})
const { find, findById, updateUser, deleteUser, createUser, login } = require('../controller/users.ctl')

userRouter.get('/', find)

userRouter.post('/', createUser)

userRouter.get('/:id', findById)

userRouter.patch('/:id', updateUser)

userRouter.delete('/:id', deleteUser)

userRouter.post('/login', login)

module.exports = userRouter