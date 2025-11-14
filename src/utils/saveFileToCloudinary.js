import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

// Lazy initialization - конфігуруємо при першому виклику
let isConfigured = false;

const configureCloudinary = () => {
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    isConfigured = true;
  }
};

// Функція для завантаження файлу у Cloudinary
export const saveFileToCloudinary = (buffer) => {
  configureCloudinary(); // Конфігуруємо перед використанням

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        resource_type: 'image',
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      },
    );

    // Створюємо читабельний стрім з буфера
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Передаємо стрім у Cloudinary
    readableStream.pipe(uploadStream);
  });
};
