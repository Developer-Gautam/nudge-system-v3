const mongoose = require('mongoose');
const User = require('../models/User');
const Question = require('../models/Question');
require('dotenv').config();

async function fixUserProgress() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nudge-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get all questions
    const questions = await Question.find({ isActive: true }).sort({ order: 1 });
    console.log(`Found ${questions.length} questions`);

    if (questions.length === 0) {
      console.log('No questions found. Please run npm run seed first.');
      process.exit(1);
    }

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    let fixedCount = 0;

    for (const user of users) {
      // Check if user has question progress
      if (!user.questionProgress || user.questionProgress.length === 0) {
        console.log(`Fixing user: ${user.email}`);
        
        // Initialize question progress
        const questionProgress = questions.map((q) => ({
          questionId: q.questionId,
          answered: false,
          answer: '',
          answeredAt: null,
          nudgeCount: 0,
          lastNudgeSent: null
        }));

        user.questionProgress = questionProgress;
        user.currentQuestion = 0;
        await user.save();
        
        fixedCount++;
        console.log(`Fixed user: ${user.email}`);
      }
    }

    console.log(`Fixed ${fixedCount} users`);
    console.log('User progress fix completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user progress:', error);
    process.exit(1);
  }
}

fixUserProgress();
