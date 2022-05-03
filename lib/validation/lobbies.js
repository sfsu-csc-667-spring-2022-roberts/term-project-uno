const Joi = require('@hapi/joi');

function validateCreateLobby(data) {
  const schema = Joi.object({
    lobbyName: Joi.string().min(1).max(128).required(),
    maxPlayers: Joi.number().min(2).max(10).required(),
    password: Joi.string().allow('').max(32).pattern(/\s+/, { invert: true }).optional(),
  });
  return schema.validate(data);
}

function validateUpdateLobby(data) {
  const schema = Joi.object({
    lobbyName: Joi.string().min(1).max(128).required(),
    maxPlayers: Joi.number().min(2).max(10).required(),
    password: Joi.string().allow('').max(32).pattern(/\s+/, { invert: true }).optional(),
    updatePassword: Joi.boolean().optional()
  });
  return schema.validate(data);
}

module.exports = {
  validateCreateLobby,
  validateUpdateLobby
}