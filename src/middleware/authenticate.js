import createHttpError from 'http-errors';
import { Session } from '../models/session.js';
import { User } from '../models/user.js';

export const authenticate = async (req, res, next) => {
  try {
    const { accessToken } = req.cookies;

    if (!accessToken) {
      throw createHttpError(401, 'Access token not provided');
    }

    // Знаходимо сесію за access token
    const session = await Session.findOne({ accessToken });

    if (!session) {
      throw createHttpError(401, 'Invalid access token');
    }

    // Перевіряємо термін дії access token
    if (new Date() > session.accessTokenValidUntil) {
      throw createHttpError(401, 'Access token expired');
    }

    // Знаходимо користувача
    const user = await User.findById(session.userId);

    if (!user) {
      throw createHttpError(401, 'User not found');
    }

    // Додаємо користувача до req
    req.user = user;

    next();
  } catch (error) {
    next(error);
  }
};
