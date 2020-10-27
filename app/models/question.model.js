// 用户模型
const mongoose = require('mongoose');
const { Schema, model } = mongoose

const QuestionSchema = new Schema({
  __v: { type: Number, select: false },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  questioner: { type: Schema.Types.ObjectId, ref: "User", required: true, select: false },
  topics: {
    type: [{ type: Schema.Types.ObjectId, ref: "Topic" }],
    select: false
  },
  createOn: { type: Date, default: Date.now },
  updateOn: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createOn', updatedAt: 'updateOn' }
});

const QuestionModel = model('Question', QuestionSchema)
module.exports = QuestionModel