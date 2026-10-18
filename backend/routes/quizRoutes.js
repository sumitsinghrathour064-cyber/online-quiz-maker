
const express = require("express");
const router = express.Router();
const Quiz = require("../models/Quiz");
const authMiddleware = require("../middleware/authMiddleware");

// GET all quizzes (public)
router.get("/", async (req, res) => {
  try {
    const quizzes = await Quiz.find().sort({ createdAt: -1 });
    res.status(200).json(quizzes);
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch quizzes.",
    });
  }
});

// GET a single quiz (public)
router.get("/:id", async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    res.status(200).json(quiz);
  } catch (error) {
    res.status(400).json({
      message: "Invalid quiz ID.",
    });
  }
});

// CREATE a quiz (login required)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, category, questions } = req.body;

    if (
      !title?.trim() ||
      !category?.trim() ||
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        message:
          "Title, category and at least one question are required.",
      });
    }

    const quiz = await Quiz.create({
      title,
      description,
      category,
      questions,
    });

    res.status(201).json({
      message: "Quiz created successfully!",
      quiz,
    });
  } catch (error) {
    res.status(400).json({
      message: error.message || "Failed to create quiz.",
    });
  }
});

// DELETE a quiz (login required)
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const quiz = await Quiz.findByIdAndDelete(req.params.id);

    if (!quiz) {
      return res.status(404).json({
        message: "Quiz not found.",
      });
    }

    res.status(200).json({
      message: "Quiz deleted successfully.",
    });
  } catch (error) {
    res.status(400).json({
      message: "Invalid quiz ID.",
    });
  }
});

module.exports = router;
