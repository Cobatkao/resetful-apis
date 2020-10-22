// 用户模型
const mongoose = require('mongoose');
const { schema } = require('./topic.model');
const { Schema, model } = mongoose

const QuestionSchema = new Schema({
  __v: { type: Number, select: false },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  questioner: { type: Schema.Types.ObjectId, ref: "User", required: true, select: false },
  createOn: {
    type: Date,
    default: Date.now     // 为该字段设置默认值
  }
}, { versionKey: false });

const QuestionModel = model('Question', QuestionSchema)
module.exports = QuestionModel