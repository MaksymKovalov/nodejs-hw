import multer from 'multer';
import createHttpError from 'http-errors';

// Налаштування зберігання файлу в пам'яті
const storage = multer.memoryStorage();

// Фільтр для перевірки типу файлу
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(createHttpError(400, 'Only images allowed'), false);
  }
};

// Налаштування multer
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
});
