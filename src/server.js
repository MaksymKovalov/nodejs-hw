import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { errors as celebrateErrors } from 'celebrate';
import { connectMongoDB } from './db/connectMongoDB.js';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRoutes from './routes/notesRoutes.js';

// Завантаження змінних оточення
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(logger); // Логування HTTP-запитів
app.use(cors()); // Дозволяє запити з інших доменів
app.use(express.json()); // Обробка JSON у body запиту

// Маршрути
app.use(notesRoutes);

// Middleware для обробки неіснуючих маршрутів (404)
app.use(notFoundHandler);

// Обробка помилок валідації celebrate
app.use(celebrateErrors());

// Middleware для обробки помилок (500)
app.use(errorHandler);

// Підключення до MongoDB та запуск сервера
const startServer = async () => {
  await connectMongoDB();
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};

startServer();
