const Joi = require("@hapi/joi");

const User = require("./user.model");

module.exports = {
  // GET /v1/members
  listUsers: {
    query: Joi.object({
      page: Joi.number().min(1),
      perPage: Joi.number().min(1).max(100),
      name: Joi.string(),
      email: Joi.string(),
      role: Joi.string().valid(...User.roles),
    }),
  },

  // POST /v1/members
  createUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      name: Joi.string().max(128),
      role: Joi.string().valid(...User.roles),
    }),
  },

  // PUT /v1/members/:userId
  replaceUser: {
    body: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(6).max(128).required(),
      name: Joi.string().max(128),
      role: Joi.string().valid(...User.roles),
    }),
    params: Joi.object({
      userId: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
  },

  // PATCH /v1/members/:userId
  updateUser: {
    body: Joi.object({
      email: Joi.string().email(),
      password: Joi.string().min(6).max(128),
      name: Joi.string().max(128),
      role: Joi.string().valid(...User.roles),
    }),
    params: Joi.object({
      userId: Joi.string()
        .regex(/^[a-fA-F0-9]{24}$/)
        .required(),
    }),
  },
};
