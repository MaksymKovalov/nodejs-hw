import nodemailer from 'nodemailer';

// Lazy initialization - створюємо транспортер при першому виклику
let transporter = null;

const getTransporter = () => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT, 10),
      secure: false, // true для 465, false для інших портів
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }
  return transporter;
};

// Функція для надсилання email
export const sendEmail = async (options) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
    };

    const info = await getTransporter().sendMail(mailOptions);
    return info;
  } catch (error) {
    throw error;
  }
};
