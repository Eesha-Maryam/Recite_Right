const catchAsync = require('../utils/catchAsync');
const { generateQuiz, submitQuiz, getUserQuizzes, getQuizById } = require('../services/quiz.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/response');
const httpStatus = require('http-status');
const Quiz = require('../models/quiz.model');

const getQuiz = catchAsync(async (req, res) => {
  const { topic, numQuestions, testMode } = req.query;

  // First, try to find existing active quiz
  const existingQuiz = await Quiz.findOne({
    createdBy: req.user.id,
    title: `${topic} Quiz`,
    status: 'active',
  });

  if (existingQuiz) {
    return ApiResponse.success(res, existingQuiz, 'Existing quiz retrieved');
  }

  // Otherwise, generate new one
  const result = await generateQuiz(topic, numQuestions, testMode, req.user.id);
  return ApiResponse.success(res, result, 'Quiz generated successfully');
});


const submitQuizAnswers = catchAsync(async (req, res) => {
  const { quizId, answers } = req.body;

  if (!quizId || !answers?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'quizId and non-empty answers array are required');
  }

  // Validate each answer based on question type
  const invalidAnswer = answers.find((answer) => {
    // All answers must have questionId and isCorrect
    if (!answer.questionId || typeof answer.isCorrect !== 'boolean') {
      return true;
    }

    // For multiple choice questions, validate selectedOption
    if (answer.hasOwnProperty('selectedOption')) {
      return (
        typeof answer.selectedOption !== 'number' ||
        answer.selectedOption < 0 ||
        answer.selectedOption > 3
      );
    }

    return false;
  });

  if (invalidAnswer) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Each answer must have: ' +
      '1. questionId (string) ' +
      '2. isCorrect (boolean) ' +
      '3. For multiple choice: selectedOption (0-3)',
    );
  }

  const result = await submitQuiz(quizId, answers, req.user.id);
  return ApiResponse.success(res, result, 'Quiz submitted successfully');
});

const getQuizzes = catchAsync(async (req, res) => {
  const quizzes = await getUserQuizzes(req.user.id);
  return ApiResponse.success(res, quizzes, 'Quizzes retrieved successfully');
});

const getQuizDetails = catchAsync(async (req, res) => {
  const quiz = await getQuizById(req.params.quizId);
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }
  return ApiResponse.success(res, quiz, 'Quiz details retrieved successfully');
});

module.exports = {
  getQuiz,
  submitQuiz: submitQuizAnswers,
  getQuizzes,
  getQuizDetails,
};
