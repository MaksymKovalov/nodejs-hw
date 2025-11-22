import { isHttpError } from 'http-errors';

export const errorHandler = (err, req, res, next) => {
  // Якщо це HttpError, використовуємо його статус та повідомлення
  if (isHttpError(err)) {
    return res.status(err.status).json({
      message: err.message,
    });
  }

  // Для всіх інших помилок повертаємо 500
  res.status(500).json({
    message: err.message || 'Internal Server Error',
  });
};
