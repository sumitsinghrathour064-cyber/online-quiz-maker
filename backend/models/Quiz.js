
const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },

  options: {
    type: [String],
    required: true,
    validate: {
      validator: (options) =>
        options.length >= 2 &&
        options.every((option) => option.trim().length > 0),
      message: "At least two non-empty options are required.",
    },
  },

  correctAnswer: {
    type: String,
    required: true,
  },
});

const quizSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      required: true,
    },

    questions: {
      type: [questionSchema],
      required: true,
      validate: {
        validator: (questions) => questions.length > 0,
        message: "A quiz must have at least one question.",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Quiz", quizSchema);
