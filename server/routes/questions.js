const express = require('express');
const Question = require('../models/Question');
const User = require('../models/User');
const { scheduleNudgeEvent, cancelNudgeEvent } = require('../config/aws');

const router = express.Router();

// Get all questions
router.get('/', async (req, res) => {
  try {
    const questions = await Question.find({ isActive: true }).sort({ order: 1 });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
});

// Get current question for user
router.get('/current', async (req, res) => {
  try {
    const user = req.user;
    
    // Get next unanswered question
    const nextQuestionId = user.getNextQuestion();
    
    if (nextQuestionId === null) {
      return res.json({ 
        message: 'All questions completed!',
        completed: true,
        question: null 
      });
    }

    const question = await Question.findOne({ 
      questionId: nextQuestionId, 
      isActive: true 
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json({
      question,
      progress: {
        current: user.currentQuestion,
        total: user.questionProgress.length,
        completed: user.questionProgress.filter(q => q.answered).length
      }
    });
  } catch (error) {
    console.error('Error fetching current question:', error);
    res.status(500).json({ error: 'Failed to fetch current question' });
  }
});

// Answer a question
router.post('/answer', async (req, res) => {
  try {
    const { questionId, answer } = req.body;
    const user = req.user;

    if (!questionId || answer === undefined) {
      return res.status(400).json({ error: 'Question ID and answer are required' });
    }

    // Find the question
    const question = await Question.findOne({ 
      questionId: parseInt(questionId), 
      isActive: true 
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Check if user has already answered this question
    const existingAnswer = user.questionProgress.find(q => 
      q.questionId === parseInt(questionId) && q.answered
    );

    if (existingAnswer) {
      return res.status(400).json({ error: 'Question already answered' });
    }

    // Cancel any pending nudges for this question
    const pendingNudge = user.questionProgress.find(q => 
      q.questionId === parseInt(questionId) && q.nudgeCount > 0
    );

    if (pendingNudge) {
      try {
        const ruleName = `nudge-${user._id}-${questionId}-${pendingNudge.nudgeCount}`;
        await cancelNudgeEvent(ruleName);
      } catch (error) {
        console.error('Error cancelling nudge:', error);
      }
    }

    // Answer the question
    await user.answerQuestion(parseInt(questionId), answer);

    // Get next question
    const nextQuestionId = user.getNextQuestion();
    let nextQuestion = null;

    if (nextQuestionId !== null) {
      nextQuestion = await Question.findOne({ 
        questionId: nextQuestionId, 
        isActive: true 
      });
    }

    res.json({
      message: 'Answer saved successfully',
      nextQuestion,
      progress: {
        current: user.currentQuestion,
        total: user.questionProgress.length,
        completed: user.questionProgress.filter(q => q.answered).length
      },
      completed: nextQuestionId === null
    });
  } catch (error) {
    console.error('Error answering question:', error);
    res.status(500).json({ error: 'Failed to save answer' });
  }
});

// Get user progress
router.get('/progress', async (req, res) => {
  try {
    const user = req.user;
    
    const progress = {
      current: user.currentQuestion,
      total: user.questionProgress.length,
      completed: user.questionProgress.filter(q => q.answered).length,
      percentage: Math.round((user.questionProgress.filter(q => q.answered).length / user.questionProgress.length) * 100),
      answers: user.questionProgress.filter(q => q.answered).map(q => ({
        questionId: q.questionId,
        answer: q.answer,
        answeredAt: q.answeredAt
      }))
    };

    res.json(progress);
  } catch (error) {
    console.error('Error fetching progress:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Get specific question by ID
router.get('/:questionId', async (req, res) => {
  try {
    const { questionId } = req.params;
    const question = await Question.findOne({ 
      questionId: parseInt(questionId), 
      isActive: true 
    });

    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ error: 'Failed to fetch question' });
  }
});

module.exports = router;
