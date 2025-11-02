# nodejs-hw

Express-додаток для роботи з колекцією нотаток.

## Встановлення

```bash
npm install
```

## Запуск

```bash
# Запуск сервера
npm start

# Запуск з nodemon (для розробки)
npm run dev
```

## Змінні оточення

Створіть файл `.env` у корені проєкту:

```
PORT=3000
```

## API Endpoints

### GET /notes
Повертає всі нотатки

**Відповідь:**
```json
{
  "message": "Retrieved all notes"
}
```

### GET /notes/:noteId
Повертає одну нотатку за ID

**Відповідь:**
```json
{
  "message": "Retrieved note with ID: {noteId}"
}
```

### GET /test-error
Тестовий маршрут для перевірки обробки помилок

## Технології

- Express.js
- CORS
- dotenv
- pino-http (логування)
- nodemon (для розробки)
- ESLint
- Prettier
