import { Joi, Segments } from 'celebrate';

// Валідація для POST /auth/register
export const registerUserSchema = {
  [Segments.BODY]: Joi.object({
    username: Joi.string().optional(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
  }),
};

// Валідація для POST /auth/login
export const loginUserSchema = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

// Валідація для POST /auth/request-reset-email
export const requestResetEmailSchema = {
  [Segments.BODY]: Joi.object({
    email: Joi.string().email().required(),
  }),
};

// Валідація для POST /auth/reset-password
export const resetPasswordSchema = {
  [Segments.BODY]: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().required(),
  }),
};
