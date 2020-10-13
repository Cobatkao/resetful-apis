## 以koa为例实践Restful Apis

### JWT 认证

#### 引用的库

koa实现JWT认证，使用了bcrypt对密码进行散列加密与登录检验密码正确性；koa-jwt对token进行验证，增加路由权限中间件；jsonwebtoken在登录时生成token下发给客户端等。

#### 错误处理

在koa中，我们可以使用`ctx.throw(409, '用户名已存在')`的方式来抛出异常。但这样的reponse仅仅是返回了错误信息，在restful api中，我们应该尽量使用json的格式返回错误信息。因此，我们在index.js中添加自定义错误中间件

```node
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (error) {
    ctx.status = error.status || error.statusCode
    ctx.body = {
      message: error.message
    }
  }
})
```

但由于koa社区的繁荣，本着不造轮子的宗旨，我们可以使用[`koa-json-error`](https://github.com/koajs/json-error)来处理错误。另外，他还以供了丰富的报错信息，甚至包含错误堆栈。

```node
// 简单用法
app.use(error())

// 区分生产/开发环境 生产环境下不需要stack
app.use(error({
  postFormat: (e, { stack, ...rest }) => process.env.NODE_ENV === 'production' ? rest : { stack, ...rest }
}))
```

#### JWT 验证

在使用 koa-jwt 后，所有的路由（除了 unless() 设置的路由除外）都会检查 Header 首部中的 token，是否存在、是否有效。只有正确之后才能正确的访问。

```node
const auth = jwt({ secret, passthrough:true }).unless({ path: [/\/login/, /\/register/] })

// 对更新和删除操作验证token
userRouter.patch('/:id', auth, checkOwner, updateUser)
userRouter.delete('/:id', auth, checkOwner, deleteUser)
```

注意几点：
1. koa-jwt调用后，会把相关的信息挂载到`ctx.state.user`上，当然你也可以自定义key，如：`app.use(jwt({ secret: 'shared-secret', key: 'userData' }))`
2. 通过添加一个passthrough选项来保证始终传递到下一个(中间件)
3. koa-jwt 其实依赖于jsonwebtoken和koa-unless两个库的，所以很多地方可以替代jsonwebtoken库

#### 登录

用户输入用户名和密码登录，如果用户名和密码正确的话，使用 jsonwebtoken.sign() 生成 token，并返回给客户端。客户端将token存储在本地存储，在每次的 HTTP 请求中，都将 token 添加在 HTTP Header Authorazition: Bearer token 中。然后后端每次去验证该token的正确与否。只有token正确后才能访问到对应的资源。


```node
async login(ctx) {
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true }
    })
    const { name, password } = ctx.request.body
    const db_user = await User.findOne({ name }).select('+password')
    if (!db_user) return ctx.throw(401, '用户名错误')
    const isPasswordValid = bcrypt.compareSync(password, db_user.password)
    if (!isPasswordValid) return ctx.throw(401, '密码错误')
    const { _id, name: db_name } = db_user
    const token = jwt.sign({id :_id, name: db_name}, secret, { expiresIn: tokenExpiresTime }) 
    // 设置token过期时间
    // 登录成功 返回token
    ctx.body = {
      token,
      name: db_name
    }
  }
```

#### 注册

注册很简单，这里只是简单的将密码加密，将信息存入数据库。实际项目中，还需要对用户输入的字段进行验证。


```node
async registerUser(ctx) { 
    ctx.verifyParams({
      name: { type: 'string', required: true },
      password: { type: 'string', required: true },
      city: { type: 'string', required: false },
    })
    const { name } = ctx.request.body
    const isValidUsr = await User.findOne({ name })
    if (isValidUsr) return ctx.throw(409, '用户名已存在')
    try {
      const user = await new User(ctx.request.body).save()
      ctx.status = 200
      ctx.body = {
        message: '注册成功',
        user
      }
    } catch (error) {
      ctx.throw(500, error || error.message)
    }
  }
```