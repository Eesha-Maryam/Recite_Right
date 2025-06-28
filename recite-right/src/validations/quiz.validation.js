const Joi = require('joi');
const { objectId } = require('./custom.validation');

const generateQuiz = {
  query: Joi.object().keys({
    topic: Joi.string().required().min(3).max(200),
    numQuestions: Joi.number().integer().min(1).max(20).default(5),
    testMode: Joi.string().default('easy'),
  }),
};

const submitQuiz = {
  body: Joi.object().keys({
    quizId: Joi.string().required().custom(objectId),
    answers: Joi.array()
      .items(
        Joi.object().keys({
          questionId: Joi.string().required().custom(objectId),
          selectedOption: Joi.number().integer().min(0).max(3),
          isCorrect: Joi.boolean().required(),
        }),
      )
      .min(1)
      .required(),
  }),
};

const getQuizById = {
  params: Joi.object().keys({
    quizId: Joi.string().required().custom(objectId),
  }),
};

module.exports = {
  generateQuiz,
  submitQuiz,
  getQuizById,
};
