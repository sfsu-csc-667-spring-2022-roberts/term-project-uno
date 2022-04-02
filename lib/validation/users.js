const Joi = require('@hapi/joi');

function registerValidation(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16).required(),
    password: Joi.string().max(32).min(4).required(),
    confirmPassword: Joi.string().max(32).min(4).required()
  });
  return schema.validate(data);
}

function loginValidation(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16).required(),
    password: Joi.string().max(32).min(4).required(),
  });
  return schema.validate(data);
}

module.exports = {
  registerValidation,
  loginValidation
};