import express from 'express';
import cors from 'cors';
import pino from 'pino-http';
import dotenv from 'dotenv';

// Завантаження змінних оточення
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Налаштування логера pino-http
const logger = pino({
  transport: {
    target: 'pino-pretty',
  },
});

// Middleware
app.use(cors()); // Дозволяє запити з інших доменів
app.use(express.json()); // Обробка JSON у body запиту
app.use(logger); // Логування HTTP-запитів

// Маршрути
// GET /notes - повернути всі нотатки
app.get('/notes', (req, res) => {
  res.status(200).json({
    message: 'Retrieved all notes',
  });
});

// GET /notes/:noteId - повернути одну нотатку за ID
app.get('/notes/:noteId', (req, res) => {
  const { noteId } = req.params;
  res.status(200).json({
    message: `Retrieved note with ID: ${noteId}`,
  });
});

// GET /test-error - тестовий маршрут для перевірки обробки помилок
app.get('/test-error', () => {
  throw new Error('Simulated server error');
});

// Middleware для обробки неіснуючих маршрутів (404)
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
  });
});

// Middleware для обробки помилок (500)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message,
  });
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
