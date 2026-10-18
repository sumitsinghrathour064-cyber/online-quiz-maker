import React, { useState, useEffect } from "react";
import "./App.css";

const sampleQuizzes = [
  {
    id: 1,
    title: "Web Development",
    category: "Technology",
    description: "Test your HTML, CSS and web knowledge.",
    icon: "💻",
    color: "mint",
    questions: [
      {
        question: "What does HTML stand for?",
        options: [
          "Hyper Text Markup Language",
          "High Transfer Machine Language",
          "Hyper Tool Multi Language",
          "Home Text Markup Language",
        ],
        correct: 0,
      },
      {
        question: "Which language is used to style a web page?",
        options: ["Python", "CSS", "C++", "SQL"],
        correct: 1,
      },
      {
        question: "Which HTML tag creates a hyperlink?",
        options: ["<link>", "<href>", "<a>", "<url>"],
        correct: 2,
      },
    ],
  },
  {
    id: 2,
    title: "Science & Nature",
    category: "Science",
    description: "Explore the amazing world around us.",
    icon: "🌿",
    color: "peach",
    questions: [
      {
        question: "Which planet is known as the Red Planet?",
        options: ["Venus", "Mars", "Jupiter", "Mercury"],
        correct: 1,
      },
      {
        question: "What is the chemical formula of water?",
        options: ["CO₂", "O₂", "H₂O", "NaCl"],
        correct: 2,
      },
    ],
  },
  {
    id: 3,
    title: "General Knowledge",
    category: "Knowledge",
    description: "Challenge yourself with everyday facts.",
    icon: "🌍",
    color: "lavender",
    questions: [
      {
        question: "How many days are there in a leap year?",
        options: ["364", "365", "366", "367"],
        correct: 2,
      },
      {
        question: "Which is the largest ocean on Earth?",
        options: [
          "Atlantic Ocean",
          "Indian Ocean",
          "Arctic Ocean",
          "Pacific Ocean",
        ],
        correct: 3,
      },
    ],
  },
];

function App() {
  const [quizzes, setQuizzes] = useState(sampleQuizzes);

  useEffect(() => {
    fetch("http://localhost:5000/api/quizzes")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch quizzes");
        }
        return response.json();
      })
      .then((data) => {
        // Convert MongoDB quiz documents into the format used by this UI.
        const savedQuizzes = data.map((quiz) => ({
          id: quiz._id,
          title: quiz.title,
          category: quiz.category,
          description: quiz.description || "A quiz created by the community.",
          icon: "🧠",
          color: "mint",
          questions: quiz.questions.map((question) => ({
            question: question.questionText,
            options: question.options,
            correct: question.options.indexOf(question.correctAnswer),
          })),
        }));

        // Keep the built-in demo quizzes and add quizzes saved in MongoDB.
        setQuizzes([...savedQuizzes, ...sampleQuizzes]);
      })
      .catch((error) => {
        console.error("Error fetching quizzes:", error);
        // Demo quizzes remain available if the backend is not running.
      });
  }, []);
  const [page, setPage] = useState("home");
  const [search, setSearch] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [quizTitle, setQuizTitle] = useState("");
  const [category, setCategory] = useState("General");
  const [description, setDescription] = useState("");
  const [draftQuestions, setDraftQuestions] = useState([
    { question: "", options: ["", "", "", ""], correct: 0 },
  ]);
  const [result, setResult] = useState(false);

  // Authentication state
  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authUser, setAuthUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("quiznest_user")) || null;
    } catch {
      return null;
    }
  });
  const [authMessage, setAuthMessage] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  const filteredQuizzes = quizzes.filter((quiz) =>
    `${quiz.title} ${quiz.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function openQuiz(quiz) {
    setSelectedQuiz(quiz);
    setQuestionIndex(0);
    setAnswers({});
    setResult(false);
    setPage("take");
    window.scrollTo(0, 0);
  }

  function updateDraftQuestion(index, field, value) {
    setDraftQuestions((current) =>
      current.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    );
  }

  function updateDraftOption(questionIndex, optionIndex, value) {
    setDraftQuestions((current) =>
      current.map((item, i) =>
        i === questionIndex
          ? {
              ...item,
              options: item.options.map((option, j) =>
                j === optionIndex ? value : option
              ),
            }
          : item
      )
    );
  }

  function addQuestion() {
    setDraftQuestions((current) => [
      ...current,
      { question: "", options: ["", "", "", ""], correct: 0 },
    ]);
  }

  async function createQuiz(event) {
    event.preventDefault();

    const token = localStorage.getItem("quiznest_token");
    const user = localStorage.getItem("quiznest_user");
    if (!token || !user) {
      openAuth("login");
      setAuthMessage("Please log in to create a quiz.");
      return;
    }

    const validQuestions = draftQuestions.every(
      (question) =>
        question.question.trim() &&
        question.options.every((option) => option.trim())
    );

    if (!quizTitle.trim() || !validQuestions) {
      alert("Please fill in the quiz title, every question and all four options.");
      return;
    }

    const quizPayload = {
      title: quizTitle.trim(),
      category,
      description: description.trim() || "A new quiz created by you.",
      questions: draftQuestions.map((question) => ({
        questionText: question.question.trim(),
        options: question.options.map((option) => option.trim()),
        correctAnswer: question.options[question.correct].trim(),
      })),
    };

    try {
      const response = await fetch("http://localhost:5000/api/quizzes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("quiznest_token") || ""}`,
        },
        body: JSON.stringify(quizPayload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save this quiz.");
      }

      // Convert the saved MongoDB document to the format used by this UI.
      const savedQuiz = {
        id: data.quiz._id,
        title: data.quiz.title,
        category: data.quiz.category,
        description: data.quiz.description || "A new quiz created by you.",
        icon: "🧠",
        color: "mint",
        questions: data.quiz.questions.map((question) => ({
          question: question.questionText,
          options: question.options,
          correct: question.options.indexOf(question.correctAnswer),
        })),
      };

      setQuizzes((current) => [
        savedQuiz,
        ...current.filter((quiz) => quiz.id !== savedQuiz.id),
      ]);
      setQuizTitle("");
      setCategory("General");
      setDescription("");
      setDraftQuestions([
        { question: "", options: ["", "", "", ""], correct: 0 },
      ]);
      setPage("home");
      setSearch("");
      window.scrollTo(0, 0);
    } catch (error) {
      console.error("Error saving quiz:", error);
      alert(
        `Quiz save nahi hua. Check karo ki backend aur MongoDB chal rahe hain.\n\n${error.message}`
      );
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage("");
    setAuthLoading(true);

    const endpoint = authMode === "register" ? "register" : "login";
    const payload =
      authMode === "register"
        ? {
            name: authName.trim(),
            email: authEmail.trim(),
            password: authPassword,
          }
        : {
            email: authEmail.trim(),
            password: authPassword,
          };

    try {
      const response = await fetch(
        `http://localhost:5000/api/auth/${endpoint}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong.");
      }

      if (authMode === "register") {
        setAuthMessage("Registration successful! Please log in.");
        setAuthMode("login");
        setAuthName("");
        setAuthPassword("");
      } else {
        localStorage.setItem("quiznest_token", data.token);
        localStorage.setItem("quiznest_user", JSON.stringify(data.user));
        setAuthUser(data.user);
        setAuthPassword("");
        setAuthMessage("");
        setPage("home");
        window.scrollTo(0, 0);
      }
    } catch (error) {
      setAuthMessage(
        error.message || "Unable to connect to the server. Check that the backend is running."
      );
    } finally {
      setAuthLoading(false);
    }
  }

  function openCreateQuiz() {
    const token = localStorage.getItem("quiznest_token");
    const user = localStorage.getItem("quiznest_user");

    if (!token || !user) {
      setAuthMode("login");
      setAuthMessage("Please log in to create a quiz.");
      setAuthPassword("");
      setPage("auth");
      window.scrollTo(0, 0);
      return;
    }

    setAuthMessage("");
    setPage("create");
    window.scrollTo(0, 0);
  }

  function handleLogout() {
    localStorage.removeItem("quiznest_token");
    localStorage.removeItem("quiznest_user");
    setAuthUser(null);
    setAuthMessage("");
    setAuthPassword("");
    setPage("home");
    window.scrollTo(0, 0);
  }

  function openAuth(mode) {
    setAuthMode(mode);
    setAuthMessage("");
    setAuthPassword("");
    setPage("auth");
    window.scrollTo(0, 0);
  }

  function submitQuiz() {
    setResult(true);
    setPage("result");
    window.scrollTo(0, 0);
  }

  function goHome() {
    setPage("home");
    setSelectedQuiz(null);
    setResult(false);
    window.scrollTo(0, 0);
  }

  const currentQuestion = selectedQuiz?.questions[questionIndex];
  const score = selectedQuiz
    ? selectedQuiz.questions.reduce(
        (total, question, index) =>
          total + (answers[index] === question.correct ? 1 : 0),
        0
      )
    : 0;

  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="logo" onClick={goHome} aria-label="QuizNest home">
          <span className="logo-mark">q</span>
          <span>quiz<span className="logo-light">nest</span></span>
        </button>

        <nav className="navigation">
          <button
            className={page === "home" ? "nav-item active" : "nav-item"}
            onClick={goHome}
          >
            Home
          </button>
          <button
            className="nav-item"
            onClick={() => {
              goHome();
              setTimeout(
                () => document.getElementById("quiz-library")?.scrollIntoView(),
                0
              );
            }}
          >
            Explore quizzes
          </button>
          <button
            className={page === "create" ? "nav-item active" : "nav-item"}
            onClick={openCreateQuiz}
          >
            Create quiz
          </button>
        </nav>

        <button className="topbar-cta" onClick={openCreateQuiz}>
          <span>＋</span> Make a quiz
        </button>

        {authUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "14px", color: "var(--text, #334155)" }}>
              Hi, {authUser.name}
            </span>
            <button className="button-outline" onClick={handleLogout}>
              Log out
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button className="button-outline" onClick={() => openAuth("login")}>
              Log in
            </button>
            <button className="button-dark" onClick={() => openAuth("register")}>
              Sign up
            </button>
          </div>
        )}
      </header>

      {page === "auth" && (
        <main className="inner-page" style={{ minHeight: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <section
            style={{
              width: "100%",
              maxWidth: "470px",
              padding: "clamp(24px, 5vw, 42px)",
              borderRadius: "24px",
              background: "#fffdf8",
              border: "1px solid #eee8dc",
              boxShadow: "0 18px 55px rgba(64, 55, 35, 0.08)",
            }}
          >
            <button className="back-link" onClick={goHome}>← Back to quiz library</button>
            <div style={{ textAlign: "center", margin: "16px 0 28px" }}>
              <div style={{ fontSize: "38px", marginBottom: "10px" }}>🌱</div>
              <span className="tiny-label">WELCOME TO QUIZNEST</span>
              <h1 style={{ margin: "10px 0", fontSize: "clamp(28px, 4vw, 38px)" }}>
                {authMode === "register" ? <>Create your <span>account.</span></> : <>Good to see <span>you.</span></>}
              </h1>
              <p style={{ color: "#73766f", margin: 0 }}>
                {authMode === "register"
                  ? "Join the community of curious minds."
                  : "Log in and keep your curiosity going."}
              </p>
            </div>

            <form onSubmit={handleAuth} style={{ display: "grid", gap: "16px" }}>
              {authMode === "register" && (
                <label className="field-label">
                  Your name
                  <input
                    type="text"
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="Enter your name"
                    autoComplete="name"
                    required
                  />
                </label>
              )}

              <label className="field-label">
                Email address
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label className="field-label">
                Password
                <input
                  type="password"
                  value={authPassword}
                  onChange={(event) => setAuthPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={authMode === "register" ? "new-password" : "current-password"}
                  minLength={6}
                  required
                />
              </label>

              {authMessage && (
                <p
                  role="status"
                  style={{
                    margin: 0,
                    padding: "12px 14px",
                    borderRadius: "12px",
                    color: authMessage.toLowerCase().includes("successful") ? "#176b45" : "#a33434",
                    background: authMessage.toLowerCase().includes("successful") ? "#e8f7ee" : "#fff0ee",
                    fontSize: "14px",
                  }}
                >
                  {authMessage}
                </p>
              )}

              <button className="button-dark" type="submit" disabled={authLoading} style={{ width: "100%", justifyContent: "center", marginTop: "4px" }}>
                {authLoading
                  ? "Please wait..."
                  : authMode === "register"
                    ? "Create account ↗"
                    : "Log in ↗"}
              </button>
            </form>

            <p style={{ textAlign: "center", color: "#73766f", margin: "22px 0 0", fontSize: "14px" }}>
              {authMode === "register" ? "Already have an account? " : "New to QuizNest? "}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === "register" ? "login" : "register");
                  setAuthMessage("");
                  setAuthPassword("");
                }}
                style={{
                  border: 0,
                  padding: 0,
                  background: "transparent",
                  color: "#245a45",
                  fontWeight: 700,
                  cursor: "pointer",
                  font: "inherit",
                }}
              >
                {authMode === "register" ? "Log in" : "Create an account"}
              </button>
            </p>
          </section>
        </main>
      )}

      {page === "home" && (
        <main>
          <section className="welcome-section">
            <div className="welcome-copy">
              <div className="eyebrow">
                <span className="eyebrow-dot"></span>
                YOUR LITTLE CORNER OF KNOWLEDGE
              </div>

              <h1>
                Curious minds,
                <br />
                <span>come play.</span>
              </h1>

              <p>
                Learn something new, one question at a time.
                Pick a quiz, trust your instincts and see what you know.
              </p>

              <div className="welcome-actions">
                <button
                  className="button-dark"
                  onClick={() =>
                    document.getElementById("quiz-library")?.scrollIntoView({
                      behavior: "smooth",
                    })
                  }
                >
                  Find a quiz <span>↗</span>
                </button>
                <button
                  className="button-outline"
                  onClick={openCreateQuiz}
                >
                  Create your own
                </button>
              </div>

              <div className="welcome-note">
                <div className="avatar-stack">
                  <span>🌱</span>
                  <span>🧠</span>
                  <span>✨</span>
                </div>
                <p><strong>Curiosity starts here.</strong><br />Explore at your own pace.</p>
              </div>
            </div>

            <div className="welcome-art">
              <div className="art-sun"></div>
              <div className="art-leaf leaf-one">✿</div>
              <div className="art-leaf leaf-two">✦</div>
              <div className="art-scribble">✳</div>

              <div className="feature-quiz-card">
                <div className="feature-card-top">
                  <span className="tiny-label">A QUICK BRAIN BREAK</span>
                  <span className="card-sparkle">✦</span>
                </div>
                <div className="question-illustration">💡</div>
                <p className="feature-question">Ready to put your thinking cap on?</p>
                <div className="mini-answer"><span>A</span> Discover a new fact</div>
                <div className="mini-answer mini-answer-active"><span>B</span> Challenge myself <b>✓</b></div>
                <div className="mini-answer"><span>C</span> Have a little fun</div>
                <div className="mini-progress"><span></span></div>
                <div className="mini-footer"><span>GOOD THINGS TAKE CURIOSITY</span><span>✿</span></div>
              </div>

              <div className="floating-note note-top">
                <span>🌼</span>
                <div><strong>Stay curious</strong><small>Every day is a new chance</small></div>
              </div>

              <div className="floating-note note-bottom">
                <span>🎯</span>
                <div><strong>Your next challenge</strong><small>Is just one click away</small></div>
              </div>
            </div>
          </section>

          <section className="quick-strip">
            <div><span className="strip-icon">🧩</span><p><strong>{quizzes.length} quizzes</strong><small>Explore different topics</small></p></div>
            <div><span className="strip-icon">🌈</span><p><strong>Learn by playing</strong><small>Practice in a fun way</small></p></div>
            <div><span className="strip-icon">✍️</span><p><strong>Your ideas, your quiz</strong><small>Create your own questions</small></p></div>
          </section>

          <section className="library-section" id="quiz-library">
            <div className="library-heading">
              <div>
                <span className="tiny-label">A WORLD OF QUESTIONS</span>
                <h2>What are you curious about?</h2>
                <p>Choose a topic and let the fun begin.</p>
              </div>
              <label className="search-box">
                <span>⌕</span>
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Find your next quiz..."
                />
              </label>
            </div>

            <div className="category-row">
              <span className="category-pill category-pill-active">✦ All topics</span>
              <span className="category-pill">💻 Technology</span>
              <span className="category-pill">🌿 Science</span>
              <span className="category-pill">🌍 Knowledge</span>
            </div>

            <div className="quiz-grid">
              {filteredQuizzes.map((quiz, index) => (
                <article className="quiz-tile" key={quiz.id}>
                  <div className={`tile-art ${quiz.color}`}>
                    <span className="tile-number">QUIZ {String(index + 1).padStart(2, "0")}</span>
                    <span className="tile-emoji">{quiz.icon}</span>
                    <span className="tile-decoration">✳</span>
                  </div>
                  <div className="tile-body">
                    <span className="tile-category">{quiz.category}</span>
                    <h3>{quiz.title}</h3>
                    <p>{quiz.description}</p>
                    <div className="tile-footer">
                      <span>☷ {quiz.questions.length} questions</span>
                      <button onClick={() => openQuiz(quiz)}>Take quiz <span>→</span></button>
                    </div>
                  </div>
                </article>
              ))}
              {filteredQuizzes.length === 0 && (
                <div className="no-quizzes">
                  <span>🔎</span>
                  <h3>No quizzes found</h3>
                  <p>Try another search or create a new quiz.</p>
                  <button className="button-dark" onClick={openCreateQuiz}>Create a quiz</button>
                </div>
              )}
            </div>

            <div className="creator-banner">
              <div className="creator-illustration">✍️</div>
              <div>
                <span className="tiny-label">GOT A QUESTION?</span>
                <h2>Make a quiz of your own.</h2>
                <p>Turn what you know into something others can learn from.</p>
              </div>
              <button className="button-dark" onClick={openCreateQuiz}>
                Build my quiz <span>↗</span>
              </button>
            </div>
          </section>
        </main>
      )}

      {page === "create" && (
        <main className="inner-page">
          <button className="back-link" onClick={goHome}>← Back to quiz library</button>
          <div className="inner-heading">
            <span className="tiny-label">MAKE SOMETHING TO LEARN FROM</span>
            <h1>Create your <span>own quiz.</span></h1>
            <p>Add your questions, choose the right answers and share your knowledge.</p>
          </div>

          <form className="creator-form" onSubmit={createQuiz}>
            <div className="form-section-heading"><span>01</span><div><h2>Quiz details</h2><p>Give your quiz a name and a topic.</p></div></div>

            <label className="field-label">
              Quiz title
              <input value={quizTitle} onChange={(event) => setQuizTitle(event.target.value)} placeholder="e.g. Amazing Space Facts" required />
            </label>

            <div className="form-two-columns">
              <label className="field-label">
                Category
                <select value={category} onChange={(event) => setCategory(event.target.value)}>
                  <option>General</option>
                  <option>Technology</option>
                  <option>Science</option>
                  <option>Knowledge</option>
                  <option>Mathematics</option>
                  <option>History</option>
                  <option>Languages</option>
                </select>
              </label>
              <label className="field-label">
                Short description
                <input value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What is this quiz about?" />
              </label>
            </div>

            <div className="form-section-heading question-form-heading"><span>02</span><div><h2>Your questions</h2><p>Add four options and mark the correct answer.</p></div></div>

            {draftQuestions.map((question, questionIndex) => (
              <div className="question-editor" key={questionIndex}>
                <div className="editor-title"><strong>Question {questionIndex + 1}</strong><span>Multiple choice</span></div>
                <label className="field-label">
                  Question text
                  <input
                    value={question.question}
                    onChange={(event) => updateDraftQuestion(questionIndex, "question", event.target.value)}
                    placeholder="Type your question here..."
                    required
                  />
                </label>
                <div className="option-editor-grid">
                  {question.options.map((option, optionIndex) => (
                    <label className="option-editor" key={optionIndex}>
                      <span className={question.correct === optionIndex ? "option-letter correct-letter" : "option-letter"}>{String.fromCharCode(65 + optionIndex)}</span>
                      <input
                        value={option}
                        onChange={(event) => updateDraftOption(questionIndex, optionIndex, event.target.value)}
                        placeholder={`Answer option ${String.fromCharCode(65 + optionIndex)}`}
                        required
                      />
                      <input
                        className="correct-radio"
                        type="radio"
                        name={`correct-${questionIndex}`}
                        checked={question.correct === optionIndex}
                        onChange={() => updateDraftQuestion(questionIndex, "correct", optionIndex)}
                        aria-label={`Mark option ${String.fromCharCode(65 + optionIndex)} correct`}
                      />
                    </label>
                  ))}
                </div>
                <p className="correct-hint">◉ Select the circle beside the correct answer.</p>
              </div>
            ))}

            <button className="add-question-button" type="button" onClick={addQuestion}>＋ Add another question</button>
            <div className="form-submit-row">
              <button className="button-outline" type="button" onClick={goHome}>Cancel</button>
              <button className="button-dark" type="submit">Create quiz <span>↗</span></button>
            </div>
          </form>
        </main>
      )}

      {page === "take" && selectedQuiz && currentQuestion && (
        <main className="take-page">
          <button className="back-link" onClick={goHome}>← Back to quiz library</button>
          <div className="take-layout">
            <section className="question-card">
              <div className="take-card-top">
                <div><span className="tiny-label">{selectedQuiz.category.toUpperCase()} CHALLENGE</span><h2>{selectedQuiz.title}</h2></div>
                <span className="question-bubble">✿</span>
              </div>
              <div className="progress-details"><span>QUESTION {questionIndex + 1} OF {selectedQuiz.questions.length}</span><span>{Math.round(((questionIndex + 1) / selectedQuiz.questions.length) * 100)}%</span></div>
              <div className="question-progress"><span style={{ width: `${((questionIndex + 1) / selectedQuiz.questions.length) * 100}%` }}></span></div>

              <h1 className="main-question">{currentQuestion.question}</h1>
              <p className="select-hint">Take your time. Choose one answer.</p>

              <div className="answer-options">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    className={answers[questionIndex] === index ? "answer-choice chosen" : "answer-choice"}
                    onClick={() => setAnswers((previous) => ({ ...previous, [questionIndex]: index }))}
                  >
                    <span className="answer-letter">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                    <span className="answer-check">{answers[questionIndex] === index ? "✓" : ""}</span>
                  </button>
                ))}
              </div>

              <div className="question-controls">
                <button className="button-outline" disabled={questionIndex === 0} onClick={() => setQuestionIndex((index) => index - 1)}>← Previous</button>
                {questionIndex < selectedQuiz.questions.length - 1 ? (
                  <button className="button-dark" disabled={answers[questionIndex] === undefined} onClick={() => setQuestionIndex((index) => index + 1)}>Next question →</button>
                ) : (
                  <button className="button-dark" disabled={answers[questionIndex] === undefined} onClick={submitQuiz}>Finish quiz ✓</button>
                )}
              </div>
            </section>

            <aside className="take-aside">
              <div className="aside-illustration">🪴</div>
              <span className="tiny-label">A LITTLE REMINDER</span>
              <h3>You're doing great.</h3>
              <p>Each question is a chance to learn something new. Just focus on one at a time.</p>
              <div className="aside-divider"></div>
              <div className="answer-count"><span>✓</span><p><strong>{Object.keys(answers).length} answered</strong><small>Keep going at your own pace</small></p></div>
            </aside>
          </div>
        </main>
      )}

      {page === "result" && selectedQuiz && (
        <main className="result-page">
          <section className="result-card">
            <div className="result-illustration">{score === selectedQuiz.questions.length ? "🏆" : "🌱"}</div>
            <span className="tiny-label">QUIZ COMPLETE</span>
            <h1>Look at you, <span>learning!</span></h1>
            <p>You finished <strong>{selectedQuiz.title}</strong>. Every attempt is progress.</p>
            <div className="result-score"><strong>{score}<span>/{selectedQuiz.questions.length}</span></strong><small>Correct answers</small></div>
            <div className="result-progress"><span style={{ width: `${(score / selectedQuiz.questions.length) * 100}%` }}></span></div>
            <p className="percentage-text">{Math.round((score / selectedQuiz.questions.length) * 100)}% score</p>
            <div className="review-heading"><h2>Let's review</h2><p>Here are the correct answers.</p></div>
            <div className="review-answers">
              {selectedQuiz.questions.map((question, index) => (
                <div className="review-answer" key={index}>
                  <strong>{index + 1}. {question.question}</strong>
                  <p className={answers[index] === question.correct ? "your-answer right" : "your-answer wrong"}>
                    Your answer: {answers[index] === undefined ? "Not answered" : question.options[answers[index]]}
                  </p>
                  <p className="correct-answer">Correct answer: {question.options[question.correct]}</p>
                </div>
              ))}
            </div>
            <div className="result-actions">
              <button className="button-outline" onClick={() => openQuiz(selectedQuiz)}>Try again</button>
              <button className="button-dark" onClick={goHome}>Explore more quizzes ↗</button>
            </div>
          </section>
        </main>
      )}

      <footer className="site-footer">
        <button className="logo footer-logo" onClick={goHome}><span className="logo-mark">q</span><span>quiz<span className="logo-light">nest</span></span></button>
        <p>A little curiosity goes a long way.</p>
        <span>Learn something new, every day. ✿</span>
      </footer>
    </div>
  );
}

export default App;
