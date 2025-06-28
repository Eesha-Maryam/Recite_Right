const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

// Simple in-memory cache
const cache = new Map();

const quizSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    questions: [
      {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          auto: true,
        },
        question: {
          type: String,
          required: true,
          trim: true,
        },
        options: [
          {
            type: String,
            required: true,
            trim: true,
          },
        ],
        correctAnswer: {
          type: Number,
          required: true,
          min: 0,
        },
        surahNumber: {
          type: Number,
          required: true,
          min: 1,
          max: 114,
        },
      },
    ],
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
      index: true,
    },
    timeLimit: {
      type: Number,
      default: 300, // 5 minutes in seconds
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'archived'],
      default: 'active',
      index: true,
    },
    attempts: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
          index: true,
        },
        startedAt: {
          type: Date,
          required: true,
        },
        completedAt: {
          type: Date,
          required: true,
        },
        answers: [
          {
            questionId: {
              type: mongoose.Schema.Types.ObjectId,
              required: true,
            },
            selectedOption: {
              type: Number,
              required: true,
              min: 0,
              max: 3,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
        score: {
          type: Number,
          required: true,
          min: 0,
        },
        timeSpent: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
);

// Add compound indexes for frequently queried fields
quizSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
quizSchema.index({ difficulty: 1, status: 1 });
quizSchema.index({ 'attempts.user': 1, 'attempts.completedAt': -1 });

// Add plugin that converts mongoose to json
quizSchema.plugin(toJSON);

// Add validation for questions array
quizSchema.pre('save', function (next) {
  if (this.questions.length === 0) {
    next(new Error('Quiz must have at least one question'));
  }
  next();
});

//// Add validation for options array
//quizSchema.pre('save', function (next) {
//  const invalidQuestion = this.questions.find((q) => q.options.length !== 4);
//  if (invalidQuestion) {
//    next(new Error('Each question must have exactly 4 options'));
//  }
//  next();
//});

// Add caching for frequently accessed data
quizSchema.statics.findActiveQuizzes = async function (userId) {
  const cacheKey = `active_quizzes_${userId}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }

  const quizzes = await this.find({ status: 'active', createdBy: userId })
    .select('title description difficulty timeLimit')
    .lean();

  cache.set(cacheKey, {
    data: quizzes,
    expiry: Date.now() + 300000, // 5 minutes
  });

  return quizzes;
};

// Clear cache when quiz is modified
quizSchema.pre('save', function () {
  const cacheKey = `active_quizzes_${this.createdBy}`;
  cache.delete(cacheKey);
});

module.exports = mongoose.model('Quiz', quizSchema);
