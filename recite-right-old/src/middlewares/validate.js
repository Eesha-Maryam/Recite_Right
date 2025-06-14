const Joi = require('joi');
const httpStatus = require('http-status');
const pick = require('../utils/pick'); // utility to pick specific fields from object
const ApiError = require('../utils/ApiError'); // custom error handler

const validate = (schema) => (req, res, next) => {
  const validSchema = pick(schema, ['params', 'query', 'body']);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: 'key' }, abortEarly: false })
    .validate(object);

  if (error) {
    return next(new ApiError(httpStatus.BAD_REQUEST, error.message));
  }
  Object.assign(req, value);
  return next();
};

const logoutSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

module.exports = validate;
