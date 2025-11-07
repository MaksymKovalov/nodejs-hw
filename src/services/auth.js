import crypto from 'crypto';
import { Session } from '../models/session.js';
import { FIFTEEN_MINUTES, ONE_DAY } from '../constants/time.js';

// Генерує випадковий токен
const generateToken = () => crypto.randomBytes(32).toString('hex');

// Створює нову сесію для користувача
export const createSession = async (userId) => {
  const accessToken = generateToken();
  const refreshToken = generateToken();

  const now = new Date();
  const accessTokenValidUntil = new Date(now.getTime() + FIFTEEN_MINUTES);
  const refreshTokenValidUntil = new Date(now.getTime() + ONE_DAY);

  // Видаляємо старі сесії користувача
  await Session.deleteMany({ userId });

  // Створюємо нову сесію
  const session = await Session.create({
    userId,
    accessToken,
    refreshToken,
    accessTokenValidUntil,
    refreshTokenValidUntil,
  });

  return session;
};

// Встановлює cookies для сесії
export const setSessionCookies = (res, session) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  };

  res.cookie('accessToken', session.accessToken, {
    ...cookieOptions,
    expires: session.accessTokenValidUntil,
  });

  res.cookie('refreshToken', session.refreshToken, {
    ...cookieOptions,
    expires: session.refreshTokenValidUntil,
  });

  res.cookie('sessionId', session._id.toString(), {
    ...cookieOptions,
    expires: session.refreshTokenValidUntil,
  });
};
