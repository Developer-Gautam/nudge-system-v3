const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionId: {
    type: Number,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'multiple_choice', 'rating'],
    default: 'text'
  },
  options: [String], // For multiple choice questions
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Question', questionSchema);
