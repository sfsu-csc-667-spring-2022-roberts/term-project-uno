const Joi = require('@hapi/joi');

function validateRegister(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'notifications', 'leaderboard']).required(),
    password: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required(),
    confirmPassword: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required()
  });
  return schema.validate(data);
}

function validateLogin(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'notifications', 'leaderboard']).required(),
    password: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required(),
  });
  return schema.validate(data);
}

function validateUsername(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'notifications', 'leaderboard']).required(),
  });
  return schema.validate(data);
}

function validateChangeUsername(data) {
  const schema = Joi.object({
    username: Joi.string().alphanum().min(1).max(16)
      .invalid(...['register', 'login', 'logout', 'settings', 'games', 'lobbies', 'notifications', 'leaderboard']).required(),
    password: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required()
  });
  return schema.validate(data);
}

function validateChangePassword(data) {
  const schema = Joi.object({
    oldPassword: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required(),
    newPassword: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required(),
    confirmNewPassword: Joi.string().min(4).max(32).pattern(/\s+/, { invert: true }).required(),
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