// 用户模型
const mongoose = require('mongoose')
const { Schema, model } = mongoose
const bcrypt = require('bcrypt')
const saltRounds = 10

const UserSchema = new Schema({
  __v: { type: Number, select: false }, // 隐藏掉__v
  name: { type: String, required: true },
  city: { type: String, required: false },
  password: { type: String, required: true, select: false, set(value) { 
    // 对密码进行加密，且接口返回中排除密码字段
    return bcrypt.hashSync(value, saltRounds);
  }
  },
  avatar_url: { type: String },
  gender: { type: String, enum: ['male', 'female'], default: 'male', required: true },
  headline: { type: String, default: '' },
  residence: { type: [{ type: String }], select: false },
  business: { type: String, select: false },
  employments: {
    type: [{
      company: { type: String },
      position: { type: String }
    }],
    select: false
  },
  educations: {
    type: [{
      school: { type: String },
      major: { type: String },
      diploma: { type: Number, enum: [1, 2, 3, 4, 5] },
      entrance_year: { type: Number },
      graduation_year: { type: Number },
    }],
    select: false
  },
  brief: { type: String, default: '' },
  following: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    select: false
  }
});

const UserModel = model('User', UserSchema)
module.exports = UserModel