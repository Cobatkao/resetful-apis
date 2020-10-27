// 用户模型
const mongoose = require('mongoose');
const { Schema, model } = mongoose

const AnswerSchema = new Schema({
  __v: { type: Number, select: false },
  content: { type: String, required: true, trim: true },
  answerer: { type: Schema.Types.ObjectId, ref: "User", required: true, select: false },
  questionId: { type: String, required: true },
  voteCount: { type: Number, required: true, default: 0 },
  createOn: { type: Date, default: Date.now },
  updateOn: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createOn', updatedAt: 'updateOn' }
});

const AnswerModel = model('Answer', AnswerSchema)
module.exports = AnswerModel