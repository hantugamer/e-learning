const appState = {
  currentGrade: null,
  currentSubject: null,
  currentChapter: null,
  currentQuestions: [],
  currentQuestionIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  selectedAnswer: null,
  answered: false,
  questionStarted: false,
  attempts: 0,
  progress: null,
  moveTimer: null
};

const STORAGE_KEY = "elearning_v3_progress";

const HOME = "homeScreen";
const GRADE = "gradeScreen";
const QUIZ = "quizScreen";
const RESULT = "resultScreen";

const homeScreen = document.getElementById("homeScreen");
const gradeScreen = document.getElementById("gradeScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const gradeTitle = document.getElementById("gradeTitle");
const gradeTag = document.getElementById("gradeTag");
const subjectGrid = document.getElementById("subjectGrid");
const chapterPanel = document.getElementById("chapterPanel");
const chapterTitle = document.getElementById("chapterTitle");
const chapterGrid = document.getElementById("chapterGrid");
const chapterScreen = document.getElementById("chapterScreen");
const chapterScreenGrid = document.getElementById("chapterScreenGrid");
const chapterScreenTitle = document.getElementById("chapterScreenTitle");
const backChapterBtn = document.getElementById("backChapterBtn");

const xpStat = document.getElementById("xpStat");
const starStat = document.getElementById("starStat");
const coinStat = document.getElementById("coinStat");
const badgeStrip = document.getElementById("badgeStrip");

const quizGradeTag = document.getElementById("quizGradeTag");
const quizTitle = document.getElementById("quizTitle");
const chapterBadge = document.getElementById("chapterBadge");
const questionCount = document.getElementById("questionCount");
const questionText = document.getElementById("questionText");
const answerGrid = document.getElementById("answerGrid");
const progressBar = document.getElementById("progressBar");
const feedbackBox = document.getElementById("feedbackBox");
const feedbackText = document.getElementById("feedbackText");
const explanationBox = document.getElementById("explanationBox");
const explanationText = document.getElementById("explanationText");
const nextBtn = document.getElementById("nextBtn");
const subjectKicker = document.getElementById("subjectKicker");

const resultPercent = document.getElementById("resultPercent");
const resultTotal = document.getElementById("resultTotal");
const resultCorrect = document.getElementById("resultCorrect");
const resultWrong = document.getElementById("resultWrong");
const resultScore = document.getElementById("resultScore");
const resultPercentage = document.getElementById("resultPercentage");
const rewardSummary = document.getElementById("rewardSummary");

const homeBtn = document.getElementById("homeBtn");
const backGradeBtn = document.getElementById("backGradeBtn");
const backQuizBtn = document.getElementById("backQuizBtn");
const retryBtn = document.getElementById("retryBtn");
const menuBtn = document.getElementById("menuBtn");

function getDefaultProgress() {
  return {
    xp: 0,
    stars: 0,
    coins: 0,
    completed: {},
    chapterCompleted: {},
    badges: ["🌱 Pemula"],
    bestScores: {}
  };
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return getDefaultProgress();
    }
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultProgress(),
      ...parsed,
      completed: parsed.completed || {},
      chapterCompleted: parsed.chapterCompleted || {},
      badges: parsed.badges || ["🌱 Pemula"],
      bestScores: parsed.bestScores || {}
    };
  } catch (e) {
    return getDefaultProgress();
  }
}

function saveProgress() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState.progress));
  } catch (e) {
    // Local storage may be restricted in some browsers.
  }
}

function createDefaultProgress() {
  appState.progress = getDefaultProgress();
  saveProgress();
}

function ensureProgress() {
  if (!appState.progress) {
    appState.progress = loadProgress();
  }
}

function showScreen(screenName) {
  const screens = {
    homeScreen,
    gradeScreen,
    quizScreen,
    resultScreen,
    chapterScreen
  };

  Object.values(screens).forEach(screen => screen.classList.remove("active"));
  const target = screens[screenName];
  if (target) {
    target.classList.add("active");
  }
}

function chooseGrade(grade) {
  appState.currentGrade = grade;
  appState.currentSubject = null;
  appState.currentQuestionIndex = 0;
  appState.score = 0;
  appState.correctCount = 0;
  appState.wrongCount = 0;

  gradeTitle.textContent = "Pilih Subjek";
  gradeTag.textContent = "Darjah " + grade;

  showScreen(GRADE);
}

function loadGradeQuestions(grade) {
  const map = {
    "1": darjah1Questions,
    "2": darjah2Questions
  };

  return map[grade] || [];
}

function getChaptersForSubject(grade, subject) {
  const questions = loadGradeQuestions(grade).filter(q => q.subject === subject);
  const chapters = [...new Set(questions.map(q => q.chapter))];
  return chapters.length ? chapters : [];
}

function renderChapters(grade, subject) {
  const chapters = getChaptersForSubject(grade, subject);
  if (!chapters.length) {
    chapterPanel.classList.remove("visible");
    chapterTitle.textContent = "Bab tersedia";
    return;
  }

  chapterGrid.innerHTML = "";
  chapters.forEach(chapter => {
    const chapterBtn = document.createElement("button");
    chapterBtn.type = "button";
    chapterBtn.className = "chapter-chip";
    chapterBtn.dataset.chapter = chapter;
    chapterBtn.textContent = chapter;
    chapterBtn.addEventListener("click", () => {
      appState.currentChapter = chapter;
      chapterGrid.querySelectorAll(".chapter-chip").forEach(btn => btn.classList.toggle("active", btn === chapterBtn));
      chooseSubject(subject, chapter);
    });
    chapterGrid.appendChild(chapterBtn);
  });

  chapterTitle.textContent = subject + " • " + chapters.length + " bab";
  chapterPanel.classList.add("visible");
}

function chooseSubject(subjectName, chapterName = null) {
  appState.currentSubject = subjectName;
  appState.currentChapter = chapterName || appState.currentChapter || getChaptersForSubject(appState.currentGrade, subjectName)[0] || null;
  const questions = loadGradeQuestions(appState.currentGrade).filter(q => q.subject === subjectName);
  appState.currentQuestions = chapterName
    ? questions.filter(q => q.chapter === chapterName)
    : questions;

  if (appState.currentQuestions.length === 0) {
    appState.currentQuestions = questions.length ? questions : loadGradeQuestions(appState.currentGrade);
  }

  startQuiz();
}

function startQuiz() {
  appState.currentQuestionIndex = 0;
  appState.score = 0;
  appState.correctCount = 0;
  appState.wrongCount = 0;
  appState.selectedAnswer = null;
  appState.answered = false;
  appState.questionStarted = false;
  appState.attempts = 0;
  nextBtn.disabled = true;

  quizGradeTag.textContent = "Darjah " + appState.currentGrade;
  quizTitle.textContent = appState.currentSubject;
  if (appState.currentChapter) {
    chapterBadge.textContent = "Bab: " + appState.currentChapter;
  }

  showQuestion();
  showScreen(QUIZ);
}

function showQuestion() {
  const currentQuestions = appState.currentQuestions;

  if (!currentQuestions || currentQuestions.length === 0) {
    return;
  }

  if (appState.moveTimer) {
    clearTimeout(appState.moveTimer);
    appState.moveTimer = null;
  }

  const current = currentQuestions[appState.currentQuestionIndex];
  const total = currentQuestions.length;
  const progress = ((appState.currentQuestionIndex + 1) / total) * 100;

  quizGradeTag.textContent = "Darjah " + appState.currentGrade;
  quizTitle.textContent = appState.currentSubject;
  chapterBadge.textContent = "Bab: " + current.chapter;
  questionCount.textContent = "Soalan " + (appState.currentQuestionIndex + 1) + "/" + total;
  subjectKicker.textContent = "🔖 " + current.subject;
  questionText.textContent = current.question;
  progressBar.style.width = progress + "%";

  answerGrid.innerHTML = "";
  current.options.forEach((option, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "answer-option";
    button.dataset.answer = String(index);
    button.disabled = false;
    button.innerHTML = '<span class="answer-index">' + String.fromCharCode(65 + index) + '</span><span class="answer-text">' + option + '</span>';
    button.addEventListener("click", () => selectAnswer(button, option, current));
    answerGrid.appendChild(button);
  });

  appState.selectedAnswer = null;
  appState.answered = false;
  feedbackBox.classList.remove("visible");
  feedbackText.textContent = "";
  explanationBox.classList.remove("visible");
  explanationText.textContent = "";
  nextBtn.disabled = true;
  nextBtn.innerHTML = appState.currentQuestionIndex === total - 1 ? "Lihat Keputusan" : "Soalan Seterusnya <span aria-hidden='true'>➜</span>";
}

function selectAnswer(button, chosenOption, currentQuestion) {
  if (appState.answered) {
    return;
  }

  const optionButtons = Array.from(answerGrid.children);
  const isCorrect = chosenOption === currentQuestion.answer;

  if (!isCorrect) {
    appState.attempts += 1;
    appState.wrongCount += 1;

    optionButtons.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove("selected");
      btn.classList.remove("correct");
      btn.classList.remove("wrong");
    });

    button.classList.add("wrong");
    feedbackText.textContent = "❌ Belum betul!\nCuba lagi.\nKamu masih berada pada soalan ini.";
    feedbackBox.style.backgroundColor = "var(--red-soft)";
    feedbackBox.style.border = "1px solid var(--red)";
    feedbackBox.classList.add("visible");

    explanationText.textContent = "Jawapan belum betul. Cuba lagi!";
    explanationBox.classList.add("visible");
    nextBtn.disabled = true;

    return;
  }

  appState.answered = true;
  appState.selectedAnswer = chosenOption;
  appState.correctCount += 1;
  appState.score += 10;

  optionButtons.forEach(btn => {
    btn.disabled = true;
    btn.classList.remove("selected");
    btn.classList.remove("wrong");
  });

  button.classList.add("selected");
  button.classList.add("correct");

  ensureProgress();
  appState.progress.xp += 10;
  appState.progress.stars += 1;
  saveProgress();
  updateHomeStats();

  feedbackText.textContent = "✅ Betul!\n🎉 Syabas! Jawapan kamu tepat!";
  feedbackBox.style.backgroundColor = "var(--green-soft)";
  feedbackBox.style.border = "1px solid var(--green)";
  feedbackBox.classList.add("visible");

  explanationText.textContent = currentQuestion.explanation;
  explanationBox.classList.add("visible");

  appState.moveTimer = setTimeout(() => {
    if (appState.currentQuestionIndex < appState.currentQuestions.length - 1) {
      appState.currentQuestionIndex += 1;
      showQuestion();
    } else {
      showResult();
    }
  }, 700);
}

function moveToNextQuestion() {
  if (!appState.answered) {
    feedbackText.textContent = "Sila pilih jawapan dulu.";
    feedbackBox.classList.add("visible");
    return;
  }

  if (appState.currentQuestionIndex < appState.currentQuestions.length - 1) {
    appState.currentQuestionIndex += 1;
    showQuestion();
  } else {
    showResult();
  }
}

function updateBestScoreAndChapter() {
  ensureProgress();
  const total = appState.currentQuestions.length;
  const correct = appState.correctCount;
  const score = appState.score;
  const percentage = Math.round((correct / total) * 100);

  const chapterId = getChapterId();
  const previousBest = appState.progress.bestScores?.[chapterId] || 0;
  if (score > previousBest) {
    appState.progress.bestScores[chapterId] = score;
  }

  if (percentage >= 70) {
    appState.progress.chapterCompleted[chapterId] = true;
  }

  saveProgress();
}

function showResult() {
  const total = appState.currentQuestions.length;
  const correct = appState.correctCount;
  const wrong = appState.wrongCount;
  const score = appState.score;
  const percentage = Math.round((correct / total) * 100);

  resultTotal.textContent = total;
  resultCorrect.textContent = correct;
  resultWrong.textContent = wrong;
  resultScore.textContent = score;
  resultPercentage.textContent = percentage + "%";
  resultPercent.textContent = percentage + "%";

  updateBestScoreAndChapter();
  showScreen(RESULT);
}

function resetQuizState() {
  appState.currentGrade = null;
  appState.currentSubject = null;
  appState.currentChapter = null;
  appState.currentQuestions = [];
  appState.currentQuestionIndex = 0;
  appState.score = 0;
  appState.correctCount = 0;
  appState.wrongCount = 0;
  appState.selectedAnswer = null;
  appState.answered = false;
  appState.attempts = 0;
}

function getChapterId() {
  if (!appState.currentGrade || !appState.currentSubject) {
    return "chapter";
  }
  const grade = "d" + String(appState.currentGrade);
  const subject = String(appState.currentSubject).toLowerCase();
  const chapter = String(appState.currentChapter || "semua").toLowerCase().replace(/\s+/g, "-");
  return grade + "-" + subject + "-" + chapter;
}

function updateHomeStats() {
  ensureProgress();
  xpStat.textContent = appState.progress.xp + " XP";
  starStat.textContent = appState.progress.stars;
  coinStat.textContent = appState.progress.coins;

  if (badgeStrip) {
    badgeStrip.innerHTML = "";
    (appState.progress.badges || ["🌱 Pemula"]).forEach(badge => {
      const span = document.createElement("span");
      span.className = "badge-pill";
      span.textContent = badge;
      badgeStrip.appendChild(span);
    });
  }
}

function backToHome() {
  resetQuizState();
  showScreen(HOME);
}

function backToSubjectMenu() {
  appState.currentSubject = null;
  appState.currentChapter = null;
  appState.currentQuestions = [];
  appState.currentQuestionIndex = 0;
  appState.score = 0;
  appState.correctCount = 0;
  appState.wrongCount = 0;
  appState.selectedAnswer = null;
  appState.answered = false;

  gradeTitle.textContent = "Pilih Subjek";
  gradeTag.textContent = "Darjah " + appState.currentGrade;

  showScreen(GRADE);
}

function showChapterScreen(grade, subject) {
  chapterScreenTitle.textContent = "Darjah " + grade + " • " + subject;
  chapterScreenGrid.innerHTML = "";

  const chapters = getChaptersForSubject(grade, subject);
  chapters.forEach(chapter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-chip";
    button.textContent = chapter;
    button.addEventListener("click", () => {
      appState.currentChapter = chapter;
      chooseSubject(subject, chapter);
    });
    chapterScreenGrid.appendChild(button);
  });

  showScreen("chapterScreen");
}

function initEvents() {
  document.querySelectorAll(".grade-choice").forEach(choice => {
    choice.addEventListener("click", function () {
      const grade = this.getAttribute("data-grade");
      chooseGrade(grade);
    });
  });

  subjectGrid.querySelectorAll(".subject-card").forEach(card => {
    card.addEventListener("click", function () {
      const subject = this.getAttribute("data-subject");
      const grade = appState.currentGrade;
      const chapters = getChaptersForSubject(grade, subject);
      if (chapters.length > 1) {
        renderChapters(grade, subject);
        appState.currentSubject = subject;
        appState.currentChapter = null;
      } else {
        chooseSubject(subject, chapters[0] || null);
      }
    });
  });

  nextBtn.addEventListener("click", moveToNextQuestion);

  backGradeBtn.addEventListener("click", backToHome);
  backQuizBtn.addEventListener("click", backToSubjectMenu);
  backChapterBtn.addEventListener("click", () => {
    showScreen(GRADE);
  });

  retryBtn.addEventListener("click", () => {
    if (appState.currentGrade && appState.currentSubject) {
      chooseSubject(appState.currentSubject, appState.currentChapter || null);
    } else {
      showScreen(HOME);
    }
  });

  menuBtn.addEventListener("click", backToSubjectMenu);
  homeBtn.addEventListener("click", backToHome);
}

function initApp() {
  ensureProgress();
  initEvents();
  updateHomeStats();
  showScreen(HOME);
}

initApp();
