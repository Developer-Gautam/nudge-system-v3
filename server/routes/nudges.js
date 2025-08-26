const express = require('express');
const User = require('../models/User');
const Nudge = require('../models/Nudge');
const { 
  scheduleNudgeEvent, 
  cancelNudgeEvent, 
  calculateNudgeDelay, 
  getNudgeMessage,
  NUDGE_CONFIG 
} = require('../config/aws');

const router = express.Router();

// Schedule a nudge for a user's current question
router.post('/schedule', async (req, res) => {
  try {
    const user = req.user;
    
    // Get current unanswered question
    const nextQuestionId = user.getNextQuestion();
    
    if (nextQuestionId === null) {
      return res.status(400).json({ error: 'No unanswered questions found' });
    }

    // Get question progress for this question
    const questionProgress = user.questionProgress.find(q => q.questionId === nextQuestionId);
    
    if (!questionProgress) {
      return res.status(400).json({ error: 'Question progress not found' });
    }

    // Calculate delay for next nudge
    const delayMinutes = calculateNudgeDelay(questionProgress.nudgeCount);
    
    if (delayMinutes === null) {
      // Mark user as inactive after max nudges
      user.isActive = false;
      await user.save();
      
      return res.status(400).json({ 
        error: 'Maximum nudges reached. User marked as inactive.' 
      });
    }

    // Create nudge message
    const nudgeMessage = getNudgeMessage(questionProgress.nudgeCount);
    
    // Schedule the nudge
    const scheduledFor = new Date(Date.now() + delayMinutes * 60 * 1000);
    
    const nudgeData = {
      userId: user._id.toString(),
      questionId: nextQuestionId,
      nudgeCount: questionProgress.nudgeCount + 1,
      delayMinutes,
      message: nudgeMessage,
      scheduledFor
    };

    // Schedule with EventBridge
    const ruleName = await scheduleNudgeEvent(nudgeData);

    // Save nudge to database
    const nudge = new Nudge({
      userId: user._id,
      questionId: nextQuestionId,
      nudgeCount: questionProgress.nudgeCount + 1,
      scheduledFor,
      message: nudgeMessage,
      delayMinutes,
      eventBridgeRuleName: ruleName
    });

    await nudge.save();

    // Update user's question progress
    await user.incrementNudgeCount(nextQuestionId);

    res.json({
      message: 'Nudge scheduled successfully',
      nudge: {
        id: nudge._id,
        scheduledFor,
        delayMinutes,
        message: nudgeMessage,
        nudgeCount: nudge.nudgeCount
      }
    });
  } catch (error) {
    console.error('Error scheduling nudge:', error);
    res.status(500).json({ error: 'Failed to schedule nudge' });
  }
});

// Cancel pending nudges for a user
router.post('/cancel', async (req, res) => {
  try {
    const user = req.user;
    const { questionId } = req.body;

    if (!questionId) {
      return res.status(400).json({ error: 'Question ID is required' });
    }

    // Find pending nudges for this question
    const pendingNudges = await Nudge.find({
      userId: user._id,
      questionId: parseInt(questionId),
      status: 'scheduled'
    });

    // Cancel each pending nudge
    for (const nudge of pendingNudges) {
      try {
        await cancelNudgeEvent(nudge.eventBridgeRuleName);
        nudge.status = 'cancelled';
        await nudge.save();
      } catch (error) {
        console.error('Error cancelling nudge:', error);
      }
    }

    res.json({
      message: 'Nudges cancelled successfully',
      cancelledCount: pendingNudges.length
    });
  } catch (error) {
    console.error('Error cancelling nudges:', error);
    res.status(500).json({ error: 'Failed to cancel nudges' });
  }
});

// Get user's nudge history
router.get('/history', async (req, res) => {
  try {
    const user = req.user;
    
    const nudges = await Nudge.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      nudges: nudges.map(nudge => ({
        id: nudge._id,
        questionId: nudge.questionId,
        nudgeCount: nudge.nudgeCount,
        message: nudge.message,
        scheduledFor: nudge.scheduledFor,
        sentAt: nudge.sentAt,
        status: nudge.status,
        delayMinutes: nudge.delayMinutes
      }))
    });
  } catch (error) {
    console.error('Error fetching nudge history:', error);
    res.status(500).json({ error: 'Failed to fetch nudge history' });
  }
});

// Get nudge configuration
router.get('/config', (req, res) => {
  res.json({
    initialDelayMinutes: NUDGE_CONFIG.initialDelayMinutes,
    exponentialMultiplier: NUDGE_CONFIG.exponentialMultiplier,
    maxNudges: NUDGE_CONFIG.maxNudges,
    nudgeMessages: NUDGE_CONFIG.nudgeMessages
  });
});

// Process nudge (called by SQS/EventBridge)
router.post('/process', async (req, res) => {
  try {
    const { userId, questionId, nudgeCount, message } = req.body;

    if (!userId || !questionId || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user is still active
    if (!user.isActive) {
      return res.json({ message: 'User is inactive, skipping nudge' });
    }

    // Check if question is still unanswered
    const questionProgress = user.questionProgress.find(q => q.questionId === questionId);
    if (!questionProgress || questionProgress.answered) {
      return res.json({ message: 'Question already answered, skipping nudge' });
    }

    // Update nudge status
    const nudge = await Nudge.findOne({
      userId: user._id,
      questionId,
      nudgeCount,
      status: 'scheduled'
    });

    if (nudge) {
      nudge.status = 'sent';
      nudge.sentAt = new Date();
      await nudge.save();
    }

    // Here you would typically send the actual nudge (email, push notification, etc.)
    console.log(`Sending nudge to user ${user.email}: ${message}`);

    res.json({
      message: 'Nudge processed successfully',
      sentTo: user.email,
      nudgeMessage: message
    });
  } catch (error) {
    console.error('Error processing nudge:', error);
    res.status(500).json({ error: 'Failed to process nudge' });
  }
});

module.exports = router;
