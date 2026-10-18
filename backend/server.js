
const express = require("express");
const mongoose = require("mongoose");
const quizRoutes = require("./routes/quizRoutes");
const authRoutes = require("./routes/authRoutes");
const cors = require("cors");
require("dotenv").config();

const app = express();


app.use(cors());
app.use(express.json());
app.use("/api/quizzes", quizRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Online Quiz Maker API is running!");
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/online_quiz_maker")
  .then(() => {
    console.log("MongoDB connected successfully!");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });
