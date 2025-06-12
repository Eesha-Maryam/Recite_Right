const Joi = require('joi');

const getSurahById = {
  params: Joi.object().keys({
    surahId: Joi.string().required().min(1).max(3),
  }),
};

module.exports = {
  getSurahById,
};
