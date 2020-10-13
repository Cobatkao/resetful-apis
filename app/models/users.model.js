// 用户模型
const mongoose = require('mongoose')
const { Schema, model } = mongoose
const bcrypt = require('bcrypt')
const saltRounds = 10

const UserSchema = new Schema({
  __v: { type: Number, select: false },
  name: { type: String, required: true },
  city: { type: String, required: false },
  password: { type: String, required: true, select: false, set(value) { 
    // 对密码进行加密，且接口返回中排除密码字段
    return bcrypt.hashSync(value, saltRounds);
} }
});

const UserModel = model('User', UserSchema)
module.exports = UserModel