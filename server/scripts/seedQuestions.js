const mongoose = require('mongoose');
const Question = require('../models/Question');
require('dotenv').config();

const questions = [
  {
    questionId: 1,
    text: "What is your favorite color and why do you like it?",
    type: "text",
    order: 1
  },
  {
    questionId: 2,
    text: "If you could have dinner with any historical figure, who would it be and what would you talk about?",
    type: "text",
    order: 2
  },
  {
    questionId: 3,
    text: "What's the most challenging thing you've ever learned?",
    type: "text",
    order: 3
  },
  {
    questionId: 4,
    text: "Describe your ideal weekend in three words.",
    type: "text",
    order: 4
  },
  {
    questionId: 5,
    text: "What's a skill you've always wanted to learn but haven't had the time for?",
    type: "text",
    order: 5
  },
  {
    questionId: 6,
    text: "If you could travel anywhere in the world right now, where would you go?",
    type: "text",
    order: 6
  },
  {
    questionId: 7,
    text: "What's the best piece of advice you've ever received?",
    type: "text",
    order: 7
  },
  {
    questionId: 8,
    text: "What's something that always makes you smile?",
    type: "text",
    order: 8
  },
  {
    questionId: 9,
    text: "If you could solve one world problem, what would it be?",
    type: "text",
    order: 9
  },
  {
    questionId: 10,
    text: "What's your biggest accomplishment so far?",
    type: "text",
    order: 10
  }
];

async function seedQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nudge-system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing questions
    await Question.deleteMany({});
    console.log('Cleared existing questions');

    // Insert new questions
    const insertedQuestions = await Question.insertMany(questions);
    console.log(`Inserted ${insertedQuestions.length} questions`);

    // Display inserted questions
    insertedQuestions.forEach(q => {
      console.log(`Question ${q.questionId}: ${q.text}`);
    });

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedQuestions();
