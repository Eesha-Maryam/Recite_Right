const catchAsync = require('../utils/catchAsync');
const { generateQuiz, submitQuiz, getUserQuizzes, getQuizById } = require('../services/quiz.service');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/response');
const httpStatus = require('http-status');

const getQuiz = catchAsync(async (req, res) => {
  const { topic, numQuestions } = req.query;
  const result = await generateQuiz(topic, numQuestions, req.user.id);
  return ApiResponse.success(res, result, 'Quiz generated successfully');
});

const submitQuizAnswers = catchAsync(async (req, res) => {
  const { quizId, answers } = req.body;

  if (!quizId || !answers?.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'quizId and non-empty answers array are required');
  }

  const invalidAnswer = answers.find(
    (answer) =>
      !answer.questionId ||
      typeof answer.selectedOption !== 'number' ||
      answer.selectedOption < 0 ||
      answer.selectedOption > 3,
  );

  if (invalidAnswer) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Each answer must have a questionId and a valid selectedOption (0, 1, 2, or 3)',
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
