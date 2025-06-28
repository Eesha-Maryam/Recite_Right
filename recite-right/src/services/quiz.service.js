const { GoogleGenAI } = require('@google/genai');
const dotenv = require('dotenv');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');
const mongoose = require('mongoose');
const Quiz = require('../models/quiz.model');
const { EASY_QUIZ_PROMPT_TEMPLATE } = require('../resources/easy_question_prompt');
const { MEDIUM_HARD_QUIZ_PROMPT_TEMPLATE } = require('../resources/medium_hard_question_prompt');

// Load environment variables from .env file
dotenv.config();

// Ensure GEMINI_API_KEY is set in environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const MODEL_NAME = 'gemini-2.0-flash-001';

// Function to parse the quiz text into structured data
function parseQuiz(text, testMode = 'easy') {
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

      // Extract surah number from question text
      const surahMatch = trimmedLine.match(/\(Surah:\s*(\d+)\)/i);
      const surahNumber = surahMatch ? parseInt(surahMatch[1], 10) : 0;

      // Remove surah number from question text
      const questionText = trimmedLine.replace(/\s*\(Surah:\s*\d+\)/i, '').replace(/^\d+\.\s*/, '');

      currentQuestion = {
        _id: new mongoose.Types.ObjectId(),
        question: questionText,
        options: [],
        correctAnswer: null,
        surahNumber: surahNumber
      };
    }
    // Detect MCQ options
    else if (/^[A-D][).]\s/.test(trimmedLine)) {
      currentQuestion.options.push(trimmedLine.replace(/^[A-D][).]\s*/, ''));
    }
    // Detect answer
    else if (trimmedLine.toLowerCase().includes('answer:')) {
      const answerText = trimmedLine.split(':')[1].trim();

      // Determine if this is MCQ or recitation based on options
      if (currentQuestion.options.length > 0) {
        // MCQ - store option index
        currentQuestion.correctAnswer = answerText.charCodeAt(0) - 65; // A->0, B->1
      } else {
        // Recitation - store full text
        currentQuestion.correctAnswer = answerText;
      }
    }
    // For recitation questions, accumulate the question text
    else if (currentQuestion?.options.length === 0 && !trimmedLine.toLowerCase().includes('answer:')) {
      // Check if this line contains a surah number for recitation questions
      const surahMatch = trimmedLine.match(/\(Surah:\s*(\d+)\)/i);
      if (surahMatch) {
        currentQuestion.surahNumber = parseInt(surahMatch[1], 10);
        currentQuestion.question += '\n' + trimmedLine.replace(/\s*\(Surah:\s*\d+\)/i, '');
      } else {
        currentQuestion.question += '\n' + trimmedLine;
      }
    }
  }

  if (currentQuestion) questions.push(currentQuestion);

  const validQuestions = questions.filter(q => {
    // Validate surah number
    if (q.surahNumber === undefined || q.surahNumber < 1 || q.surahNumber > 114) {
      return false;
    }

    if (q.options.length > 0) {
      // MCQ validation
      return q.options.length === 4 &&
             Number.isInteger(q.correctAnswer) &&
             q.correctAnswer >= 0 &&
             q.correctAnswer <= 3;
    } else {
      // Recitation validation
      return typeof q.correctAnswer === 'string' &&
             q.correctAnswer.trim().length > 0;
    }
  });

  if (!validQuestions.length) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No valid questions found');
  }

  return validQuestions;
}

const generateQuiz = async (topic, numQuestions = 5, testMode = 'easy', userId) => {
  let prompt;

  console.log(testMode);

  if (testMode === 'easy') {
    prompt = EASY_QUIZ_PROMPT_TEMPLATE
      .replace('{topic}', topic)
      .replace('{numQuestions}', numQuestions);
  } else {
    console.log("using hard template");
    prompt = MEDIUM_HARD_QUIZ_PROMPT_TEMPLATE
      .replace('{topic}', topic)
      .replace('{numQuestions}', numQuestions)
      .replace('{difficulty}', testMode);
  }

  const result = await ai.models.generateContent({
    model: MODEL_NAME,
    contents: prompt,
  });

  const text =
    result?.candidates?.[0]?.content?.parts?.[0]?.text ??
    (() => {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to generate quiz content');
    })();
  console.log(text)

  const quizData = parseQuiz(text, testMode);

  return Quiz.create({
    title: `${topic} Quiz (${testMode})`,
    description: `A ${testMode} difficulty quiz about ${topic} with ${numQuestions} questions`,
    questions: quizData,
    difficulty: testMode,
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
    if (!question) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Question ${answer.questionId} not found in quiz`);
    }

    // For recitation questions (no options)
    if (!question.options || question.options.length === 0) {
      return {
        questionId: answer.questionId,
        isCorrect: answer.isCorrect,
      };
    }

    return {
      questionId: answer.questionId,
      selectedOption: answer.selectedOption,
      isCorrect: answer.isCorrect,
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
