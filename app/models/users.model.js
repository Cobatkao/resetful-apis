// 用户模型
const mongoose = require('mongoose')
const { Schema, model } = mongoose
const bcrypt = require('bcrypt')
const saltRounds = 10

const UserSchema = new Schema({
  __v: { type: Number, select: false }, // 隐藏掉__v
  name: { type: String, required: true, trim: true },
  password: { type: String, required: true, select: false, set(value) { 
    // 对密码进行加密，且接口返回中排除密码字段899 
    return bcrypt.hashSync(value, saltRounds);
  }
  },
  avatar_url: { type: String },
  gender: { type: String, enum: ['male', 'female'], default: 'male', required: true },
  headline: { type: String, default: '' },
  residence: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Topic'
    }],
    select: false
  },
  city: { type: Schema.Types.ObjectId, ref: 'Topic', select: false },
  business: { type: Schema.Types.ObjectId, ref: 'Topic', select: false },
  employments: {
    type: [{
      company: { type: Schema.Types.ObjectId, ref: 'Topic' },
      position: { type: Schema.Types.ObjectId, ref: 'Topic' }
    }],
    select: false
  },
  educations: {
    type: [{
      school: { type: Schema.Types.ObjectId, ref: 'Topic' },
      major: { type: Schema.Types.ObjectId, ref: 'Topic' },
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
  },
  followingTopics: {
    type: [{
      type: Schema.Types.ObjectId,
      ref: 'Topic'
    }],
    select: false
  }
}, { versionKey: false });

const UserModel = model('User', UserSchema)
module.exports = UserModel