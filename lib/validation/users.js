const Joi = require('@hapi/joi');

function validateRegister(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'test', 'leaderboard']).required(),
    password: Joi.string().max(32).min(4).required(),
    confirmPassword: Joi.string().max(32).min(4).required()
  });
  return schema.validate(data);
}

function validateLogin(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'test', 'leaderboard']).required(),
    password: Joi.string().max(32).min(4).required(),
  });
  return schema.validate(data);
}

function validateUsername(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'test', 'leaderboard']).required(),
  });
  return schema.validate(data);
}

function validateChangeUsername(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'test', 'leaderboard']).required(),
    password: Joi.string().max(32).min(4).required()
  });
  return schema.validate(data);
}

function validateChangePassword(data) {
  const schema = Joi.object({
    oldPassword: Joi.string().max(32).min(4).required(),
    newPassword: Joi.string().max(32).min(4).required(),
    confirmNewPassword: Joi.string().max(32).min(4).required(),
  });
  return schema.validate(data);
}

module.exports = {
  validateRegister,
  validateLogin,
  validateUsername,
  validateChangeUsername,
  validateChangePassword
};