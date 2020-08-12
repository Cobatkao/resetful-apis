const { host,
  database,
  username,
  password,
  port } = require('./db')
  
module.exports = {
    // ConnectStr:  `mongodb+srv://${username}:${password}@${host}:${port}/${database}`
    // ConnectStr:  `mongodb+srv://${username}:${password}@${host}/${database}?retryWrites=true&w=majority`
    ConnectStr:  `mongodb+srv://gaogao0330:gaohang2280784@community.kiy4j.mongodb.net/community?retryWrites=true&w=majority`,
    secret: 'dnwllwe_3329234nl1k'
}