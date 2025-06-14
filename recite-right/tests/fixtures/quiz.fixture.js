const Quiz = require('../../src/models/quiz.model');
const { userOne } = require('./user.fixture');

const quizQuestions = [
  {
    title: 'Test quiz title',
    description: 'Test quiz description',
    questions: [
      {
        question: 'What is the capital of France?',
        options: ['London', 'Berlin', 'Paris', 'Madrid'],
        correctAnswer: 2, // Index of 'Paris' in options array
      },
      {
        question: 'What is the largest planet in our solar system?',
        options: ['Earth', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 2, // Index of 'Jupiter' in options array
      },
    ],
    difficulty: 'easy',
    timeLimit: 300,
    createdBy: userOne._id,
    status: 'active',
  },
];

const insertQuizQuestions = async (questions) => {
  await Quiz.insertMany(questions);
};

module.exports = {
  quizQuestions,
  insertQuizQuestions,
};
