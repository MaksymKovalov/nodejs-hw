import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';

// POST /auth/register - реєстрація нового користувача
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Перевіряємо, чи користувач вже існує
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(409, 'Email already in use');
    }

    // Створюємо нового користувача (пароль буде хешовано в pre('save') hook)
    const user = await User.create({
      email,
      password,
      username,
    });

    // Створюємо сесію
    const session = await createSession(user._id);

    // Встановлюємо cookies
    setSessionCookies(res, session);

    res.status(201).json({
      user,
      session: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login - вхід користувача
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Знаходимо користувача
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      throw createHttpError(401, 'Invalid credentials');
    }

    // Перевіряємо пароль
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw createHttpError(401, 'Invalid credentials');
    }

    // Створюємо сесію
    const session = await createSession(user._id);

    // Встановлюємо cookies
    setSessionCookies(res, session);

    // Видаляємо пароль з відповіді
    const userWithoutPassword = user.toJSON();

    res.status(200).json({
      user: userWithoutPassword,
      session: {
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/logout - вихід користувача
export const logoutUser = async (req, res, next) => {
  try {
    const { sessionId } = req.cookies;

    if (!sessionId) {
      throw createHttpError(401, 'Session not found');
    }

    // Видаляємо сесію
    await Session.findByIdAndDelete(sessionId);

    // Очищаємо cookies
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.clearCookie('sessionId');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

// POST /auth/refresh - оновлення сесії
export const refreshUserSession = async (req, res, next) => {
  try {
    const { sessionId, refreshToken } = req.cookies;

    if (!sessionId || !refreshToken) {
      throw createHttpError(401, 'Session not found');
    }

    // Знаходимо сесію
    const session = await Session.findById(sessionId);
    if (!session) {
      throw createHttpError(401, 'Session not found');
    }

    // Перевіряємо refresh token
    if (session.refreshToken !== refreshToken) {
      throw createHttpError(401, 'Invalid refresh token');
    }

    // Перевіряємо термін дії refresh token
    if (new Date() > session.refreshTokenValidUntil) {
      throw createHttpError(401, 'Refresh token expired');
    }

    // Створюємо нову сесію
    const newSession = await createSession(session.userId);

    // Встановлюємо cookies
    setSessionCookies(res, newSession);

    res.status(200).json({
      session: {
        accessToken: newSession.accessToken,
        refreshToken: newSession.refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};
