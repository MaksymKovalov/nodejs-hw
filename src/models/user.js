import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    avatar: {
      type: String,
      default: 'https://ac.goit.global/fullstack/react/default-avatar.jpg',
    },
  },
  {
    timestamps: true,
  },
);

// Видаляє пароль з JSON-відповіді
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Встановлює username = email за замовчуванням
userSchema.pre('save', function (next) {
  if (!this.username) {
    this.username = this.email;
  }
  next();
});

// Хешування пароля перед збереженням
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

export const User = mongoose.model('User', userSchema, 'users');
