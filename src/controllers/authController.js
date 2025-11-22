import createHttpError from 'http-errors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import handlebars from 'handlebars';
import { User } from '../models/user.js';
import { Session } from '../models/session.js';
import { createSession, setSessionCookies } from '../services/auth.js';
import { sendEmail } from '../utils/sendMail.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// POST /auth/register - реєстрація нового користувача
export const registerUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    // Перевіряємо, чи користувач вже існує
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw createHttpError(400, 'Email already in use');
    }

    // Хешуємо пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Створюємо нового користувача
    const user = await User.create({
      email,
      password: hashedPassword,
      username,
    });

    // Створюємо сесію
    const session = await createSession(user._id);

    // Встановлюємо cookies
    setSessionCookies(res, session);

    res.status(201).json({
      user,
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

    // Видаляємо існуючі сесії користувача
    await Session.deleteMany({ userId: user._id });

    // Створюємо сесію
    const session = await createSession(user._id);

    // Встановлюємо cookies
    setSessionCookies(res, session);

    // Видаляємо пароль з відповіді
    const userWithoutPassword = user.toJSON();

    res.status(200).json({
      user: userWithoutPassword,
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

    // Видаляємо стару сесію
    await Session.findByIdAndDelete(sessionId);

    // Створюємо нову сесію
    const newSession = await createSession(session.userId);

    // Встановлюємо cookies
    setSessionCookies(res, newSession);

    res.status(200).json({
      message: 'Session refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/request-reset-email - надсилання email для скидання паролю
export const requestResetEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Знаходимо користувача за email
    const user = await User.findOne({ email });
    if (!user) {
      // Завжди повертаємо успіх, щоб не розкривати існування користувача
      return res.status(200).json({
        message: 'Password reset email sent successfully',
      });
    }

    // Генеруємо JWT токен зі строком дії 15 хвилин
    const resetToken = jwt.sign(
      {
        sub: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' },
    );

    // Формуємо посилання для скидання паролю
    const resetLink = `${process.env.FRONTEND_DOMAIN}/reset-password?token=${resetToken}`;

    // Читаємо HTML-шаблон
    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'reset-password-email.html',
    );
    const templateSource = await fs.readFile(templatePath, 'utf-8');

    // Компілюємо шаблон за допомогою handlebars
    const template = handlebars.compile(templateSource);
    const html = template({
      username: user.username || user.email,
      resetLink,
    });

    // Надсилаємо email
    try {
      await sendEmail({
        from: process.env.SMTP_FROM,
        to: email,
        subject: 'Скидання паролю',
        html,
      });
    } catch (emailError) {
      throw createHttpError(
        500,
        'Failed to send the email, please try again later.',
      );
    }

    res.status(200).json({
      message: 'Password reset email sent successfully',
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/reset-password - скидання паролю
export const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;

    // Верифікуємо JWT токен
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw createHttpError(401, 'Invalid or expired token');
    }

    // Знаходимо користувача за id та email з токена
    const user = await User.findOne({
      _id: payload.sub,
      email: payload.email,
    });

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    // Хешуємо новий пароль
    const hashedPassword = await bcrypt.hash(password, 10);

    // Оновлюємо пароль користувача
    await User.findByIdAndUpdate(user._id, { password: hashedPassword });

    res.status(200).json({
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};
