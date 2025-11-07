import createHttpError from 'http-errors';
import { Note } from '../models/note.js';

// GET /notes - отримати всі нотатки з пагінацією та фільтрацією
export const getAllNotes = async (req, res, next) => {
  try {
    const { page = 1, perPage = 10, tag, search } = req.query;

    // Створюємо фільтр з userId
    const filter = { userId: req.user._id };

    // Фільтрація за тегом
    if (tag) {
      filter.tag = tag;
    }

    // Текстовий пошук по title та content
    if (search) {
      filter.$text = { $search: search };
    }

    // Пагінація
    const skip = (page - 1) * perPage;
    const limit = parseInt(perPage);

    // Отримуємо нотатки та загальну кількість
    const [notes, totalNotes] = await Promise.all([
      Note.find(filter).skip(skip).limit(limit),
      Note.countDocuments(filter),
    ]);

    // Розраховуємо загальну кількість сторінок
    const totalPages = Math.ceil(totalNotes / perPage);

    res.status(200).json({
      page: parseInt(page),
      perPage: limit,
      totalNotes,
      totalPages,
      notes,
    });
  } catch (error) {
    next(error);
  }
};

// GET /notes/:noteId - отримати одну нотатку за ID
export const getNoteById = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findOne({ _id: noteId, userId: req.user._id });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

// POST /notes - створити нову нотатку
export const createNote = async (req, res, next) => {
  try {
    const note = await Note.create({ ...req.body, userId: req.user._id });
    res.status(201).json(note);
  } catch (error) {
    next(error);
  }
};

// PATCH /notes/:noteId - оновити нотатку
export const updateNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findOneAndUpdate(
      { _id: noteId, userId: req.user._id },
      req.body,
      { new: true },
    );

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};

// DELETE /notes/:noteId - видалити нотатку
export const deleteNote = async (req, res, next) => {
  try {
    const { noteId } = req.params;
    const note = await Note.findOneAndDelete({
      _id: noteId,
      userId: req.user._id,
    });

    if (!note) {
      throw createHttpError(404, 'Note not found');
    }

    res.status(200).json(note);
  } catch (error) {
    next(error);
  }
};
