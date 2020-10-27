// 用户模型
const mongoose = require('mongoose');
const { Schema, model } = mongoose

const CommentSchema = new Schema({
  __v: { type: Number, select: false },
  content: { type: String, required: true, trim: true },
  commentator: { type: Schema.Types.ObjectId, ref: "User", required: true, select: false },
  questionId: { type: String, required: true },
  answerId: { type: String, required: true },
  rootCommentId: { type: String, required: false }, // 二级评论才有的属性 一级评论_id
  replyTo: { type: Schema.Types.ObjectId, ref: 'User', required: false },
  createOn: { type: Date, default: Date.now },
  updateOn: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createOn', updatedAt: 'updateOn' }
});

const CommentModel = model('Comment', CommentSchema)
module.exports = CommentModel