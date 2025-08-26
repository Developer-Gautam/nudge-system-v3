const mongoose = require('mongoose');

const nudgeSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  questionId: {
    type: Number,
    required: true
  },
  nudgeCount: {
    type: Number,
    default: 0
  },
  scheduledFor: {
    type: Date,
    required: true
  },
  sentAt: {
    type: Date
  },
  status: {
    type: String,
    enum: ['scheduled', 'sent', 'cancelled'],
    default: 'scheduled'
  },
  message: {
    type: String,
    required: true
  },
  delayMinutes: {
    type: Number,
    required: true
  },
  sqsMessageId: {
    type: String
  },
  eventBridgeRuleName: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient querying
nudgeSchema.index({ userId: 1, questionId: 1 });
nudgeSchema.index({ scheduledFor: 1, status: 1 });

module.exports = mongoose.model('Nudge', nudgeSchema);
