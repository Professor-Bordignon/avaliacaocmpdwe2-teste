const Joi = require('joi');

const voteSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'O e-mail deve ser um endereço de e-mail válido.',
    'any.required': 'O campo e-mail é obrigatório.',
  }),
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'O ID do candidato deve ser um número.',
    'number.integer': 'O ID do candidato deve ser um número inteiro.',
    'number.positive': 'O ID do candidato deve ser um número positivo.',
    'any.required': 'O ID do candidato é obrigatório.',
  }),
});

module.exports = voteSchema;