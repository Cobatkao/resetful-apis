// 用户模型
const mongoose = require('mongoose')
const { Schema, model } = mongoose

const TopicSchema = new Schema({
  __v: { type: Number, select: false },
  name: { type: String, required: true, trim: true },
  avatar_url: { type: String, required: false },
  introduction: { type: String, required: false, select: false },
  createOn: { type: Date, default: Date.now },
  updateOn: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: { createdAt: 'createOn', updatedAt: 'updateOn' }
});

const TopicModel = model('Topic', TopicSchema)
module.exports = TopicModel