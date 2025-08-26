const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  currentQuestion: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  questionProgress: [{
    questionId: Number,
    answered: {
      type: Boolean,
      default: false
    },
    answer: String,
    answeredAt: Date,
    nudgeCount: {
      type: Number,
      default: 0
    },
    lastNudgeSent: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last activity
userSchema.methods.updateActivity = function() {
  this.lastActivity = new Date();
  this.updatedAt = new Date();
  return this.save();
};

// Get next unanswered question
userSchema.methods.getNextQuestion = function() {
  const unanswered = this.questionProgress.find(q => !q.answered);
  return unanswered ? unanswered.questionId : null;
};

// Mark question as answered
userSchema.methods.answerQuestion = function(questionId, answer) {
  const question = this.questionProgress.find(q => q.questionId === questionId);
  if (question) {
    question.answered = true;
    question.answer = answer;
    question.answeredAt = new Date();
    this.currentQuestion = questionId + 1;
    this.lastActivity = new Date();
    this.updatedAt = new Date();
  }
  return this.save();
};

// Increment nudge count for a question
userSchema.methods.incrementNudgeCount = function(questionId) {
  const question = this.questionProgress.find(q => q.questionId === questionId);
  if (question) {
    question.nudgeCount += 1;
    question.lastNudgeSent = new Date();
    this.updatedAt = new Date();
  }
  return this.save();
};

module.exports = mongoose.model('User', userSchema);
