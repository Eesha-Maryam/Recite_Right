const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');

// Load environment variables from .env file
dotenv.config();

// Ensure GEMINI_API_KEY is set in environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.0-flash-001';

const QUIZ_PROMPT_TEMPLATE = `Generate a quiz about {topic} with {numQuestions} multiple choice questions only related to memorization.
Each question text and options must be written in English, except for any Quranic words, phrases, or verses, which should be in Arabic script (no romanization).
Do not translate numbers or generic English text into Arabic. Only Quranic text should appear in Arabic script.
Each question should be formatted exactly as follows:

1. [Question text]
A) [Option 1]
B) [Option 2]
C) [Option 3]
D) [Option 4]
Answer: [Correct option letter A, B, C, or D]

Requirements:
- Each question must have exactly 4 options
- The correct answer must be one of A, B, C, or D
- Questions should be clear and well-formatted
- Include a blank line between questions
- Make sure each question is numbered sequentially`;

// Function to parse the quiz text into structured data
function parseQuiz(text) {
  if (!text?.trim()) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid quiz text format');
  }

  const questions = [];
  const lines = text.split('\n');
  let currentQuestion = null;

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;

    if (/^\d+\./.test(trimmedLine)) {
      if (currentQuestion) questions.push(currentQuestion);
      currentQuestion = {
        _id: new mongoose.Types.ObjectId(),
        question: trimmedLine.replace(/^\d+\.\s*/, ''),
        options: [],
        correctAnswer: 0,
      };
    } else if (/^[A-D][).]\s/.test(trimmedLine)) {
      currentQuestion?.options.push(trimmedLine.replace(/^[A-D][).]\s*/, ''));
    } else if (trimmedLine.toLowerCase().includes('answer:')) {
      const answer = trimmedLine.split(':')[1].trim().toUpperCase();
      if (currentQuestion) {
        currentQuestion.correctAnswer = answer.charCodeAt(0) - 65;
      }
    }
  }

  if (currentQuestion) questions.push(currentQuestion);

  const validQuestions = questions.filter(
    (q) =>
      q.question?.trim() &&
      q.options?.length === 4 &&
      Number.isInteger(q.correctAnswer) &&
      q.correctAnswer >= 0 &&
      q.correctAnswer <= 3,
  );

  if (!validQuestions.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid questions could be parsed from the response');
  }

  return validQuestions;
}

const generateQuiz = async (topic, numQuestions = 5, userId) => {
  const prompt = QUIZ_PROMPT_TEMPLATE.replace('{topic}', topic).replace('{numQuestions}', numQuestions);

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    (() => {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate quiz content');
    })();

  const quizData = parseQuiz(text);

  return Quiz.create({
    title: `${topic} Quiz`,
    description: `A quiz about ${topic} with ${numQuestions} questions`,
    questions: quizData,
    createdBy: userId,
    status: 'active',
  });
};

const submitQuiz = async (quizId, answers, userId) => {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }

  const questionMap = new Map(quiz.questions.map((q) => [q._id.toString(), q]));
  const attemptAnswers = answers.map((answer) => {
    const question = questionMap.get(answer.questionId);
    const isCorrect = question?.correctAnswer === answer.selectedOption;
    return {
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect,
    };
  });

  const score = attemptAnswers.filter((a) => a.isCorrect).length;
  const attempt = {
    _id: new mongoose.Types.ObjectId(),
    user: userId,
    startedAt: new Date(),
    completedAt: new Date(),
    answers: attemptAnswers,
    score,
    timeSpent: 0,
  };

  await Quiz.findByIdAndUpdate(quizId, {
    $push: { attempts: attempt },
  });

  return {
    score,
    totalQuestions: quiz.questions.length,
    correctAnswers: score,
    attemptId: attempt._id,
  };
};

const getUserQuizzes = async (userId) => {
  return Quiz.find({
    $or: [{ createdBy: userId }, { 'attempts.user': userId }],
  })
    .sort({ createdAt: -1 })
    .lean();
};

const getQuizById = async (quizId) => {
  const quiz = await Quiz.findById(quizId).lean();
  if (!quiz) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Quiz not found');
  }
  return quiz;
};

module.exports = {
  generateQuiz,
  submitQuiz,
  getUserQuizzes,
  getQuizById,
};
