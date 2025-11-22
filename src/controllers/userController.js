import createHttpError from 'http-errors';
import { User } from '../models/user.js';
import { saveFileToCloudinary } from '../utils/saveFileToCloudinary.js';

// PATCH /users/me/avatar - оновлення аватара користувача
export const updateUserAvatar = async (req, res, next) => {
  try {
    // Перевіряємо наявність файлу
    if (!req.file) {
      throw createHttpError(400, 'No file');
    }

    // Завантажуємо файл у Cloudinary
    const uploadResult = await saveFileToCloudinary(req.file.buffer);

    // Оновлюємо поле avatar користувача в базі даних
    await User.findByIdAndUpdate(req.user._id, {
      avatar: uploadResult.secure_url,
    });

    // Повертаємо посилання на аватар
    res.status(200).json({
      url: uploadResult.secure_url,
    });
  } catch (error) {
    next(error);
  }
};
