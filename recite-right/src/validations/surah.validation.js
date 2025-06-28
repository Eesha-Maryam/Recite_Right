const Joi = require('joi');

const getSurahById = {
  params: Joi.object().keys({
    surahId: Joi.string().required().min(78).max(114),
  }),
};

module.exports = {
  getSurahById,
};
