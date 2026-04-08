if (!window.__authOK) {
  // 誤入力・空欄・キャンセル時はクイズ初期化を行わない
} else {
const menuScreen = document.getElementById("menuScreen");
const quizScreen = document.getElementById("quizScreen");
const resultScreen = document.getElementById("resultScreen");

const startNumberInput = document.getElementById("startNumber");
const endNumberInput = document.getElementById("endNumber");
const orderedBtn = document.getElementById("orderedBtn");
const randomBtn = document.getElementById("randomBtn");
const startQuizBtn = document.getElementById("startQuizBtn");

const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const wordText = document.getElementById("wordText");
const wordNoText = document.getElementById("wordNoText");
const speakBtn = document.getElementById("speakBtn");
const choicesWrap = document.getElementById("choicesWrap");
const feedbackPanel = document.getElementById("feedbackPanel");
const resultBadge = document.getElementById("resultBadge");
const correctAnswerText = document.getElementById("correctAnswerText");
const exampleText = document.getElementById("exampleText");
const translationText = document.getElementById("translationText");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const restartSameBtn = document.getElementById("restartSameBtn");
const restartNewBtn = document.getElementById("restartNewBtn");
const menuBackButtons = [
  document.getElementById("menuBackBtnTop"),
  document.getElementById("menuBackBtnBottom"),
  document.getElementById("menuBackBtnResult")
];
const restartSameResultBtn = document.getElementById("restartSameResultBtn");
const restartNewResultBtn = document.getElementById("restartNewResultBtn");
const finalScoreText = document.getElementById("finalScoreText");
const finalRateText = document.getElementById("finalRateText");

const state = {
  start: QUIZ_META.min,
  end: QUIZ_META.max,
  mode: "ordered",
  quizItems: [],
  currentIndex: 0,
  answers: {},
};

function showScreen(target) {
  [menuScreen, quizScreen, resultScreen].forEach((screen) => {
    screen.classList.toggle("active", screen === target);
  });
}

function setMode(mode) {
  state.mode = mode;
  orderedBtn.classList.toggle("active", mode === "ordered");
  randomBtn.classList.toggle("active", mode === "random");
}

function shuffleArray(array) {
  const copied = [...array];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function buildQuizItems() {
  const filtered = WORD_DATA.filter((item) => item.serial >= state.start && item.serial <= state.end);
  if (!filtered.length) return [];
  return state.mode === "random" ? shuffleArray(filtered) : filtered;
}

function validateRange() {
  const start = Number(startNumberInput.value);
  const end = Number(endNumberInput.value);

  if (!Number.isInteger(start) || !Number.isInteger(end)) {
    alert("開始番号と終了番号を整数で入力してください。");
    return null;
  }
  if (start < QUIZ_META.min || end > QUIZ_META.max) {
    alert(`番号は${QUIZ_META.min}〜${QUIZ_META.max}の範囲で指定してください。`);
    return null;
  }
  if (start > end) {
    alert("開始番号は終了番号以下にしてください。");
    return null;
  }
  return { start, end };
}

function startQuiz() {
  const range = validateRange();
  if (!range) return;

  state.start = range.start;
  state.end = range.end;
  state.quizItems = buildQuizItems();
  state.currentIndex = 0;
  state.answers = {};

  if (!state.quizItems.length) {
    alert("指定された範囲に問題がありません。");
    return;
  }

  renderQuestion();
  showScreen(quizScreen);
}

function getCurrentItem() {
  return state.quizItems[state.currentIndex];
}

function updateScoreText() {
  const answeredEntries = Object.values(state.answers).filter(Boolean);
  const correctCount = answeredEntries.filter((entry) => entry.correct).length;
  scoreText.textContent = `正解 ${correctCount} / ${answeredEntries.length}`;
}

function createChoiceButton(choiceText, item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "choice-btn";
  button.textContent = choiceText;

  const existingAnswer = state.answers[item.serial];
  if (existingAnswer) {
    button.disabled = true;
    if (choiceText === item.answer) {
      button.classList.add("correct");
    }
    if (choiceText === existingAnswer.selected && choiceText !== item.answer) {
      button.classList.add("wrong");
    }
  }

  button.addEventListener("click", () => handleAnswer(choiceText));
  return button;
}

function renderQuestion() {
  const item = getCurrentItem();
  if (!item) return;

  progressText.textContent = `${state.currentIndex + 1} / ${state.quizItems.length}`;
  updateScoreText();
  wordText.textContent = item.word;
  wordNoText.textContent = `単語番号: ${item.wordNo}`;
  choicesWrap.innerHTML = "";
  item.options.forEach((option) => {
    choicesWrap.appendChild(createChoiceButton(option, item));
  });

  const answerState = state.answers[item.serial];
  if (answerState) {
    showFeedback(item, answerState.correct);
  } else {
    hideFeedback();
  }

  prevBtn.disabled = state.currentIndex === 0;
  nextBtn.textContent = state.currentIndex === state.quizItems.length - 1 ? "結果を見る" : "次へ";
}

function hideFeedback() {
  feedbackPanel.classList.add("hidden");
  resultBadge.className = "result-badge";
  resultBadge.textContent = "";
  correctAnswerText.textContent = "";
  exampleText.textContent = "";
  translationText.textContent = "";
}

function showFeedback(item, isCorrect) {
  feedbackPanel.classList.remove("hidden");
  resultBadge.className = `result-badge ${isCorrect ? "correct" : "wrong"}`;
  resultBadge.textContent = isCorrect ? "正解！" : "不正解";
  correctAnswerText.textContent = `正解：${item.answer}（単語番号: ${item.wordNo}）`;
  exampleText.textContent = item.example;
  translationText.textContent = item.translation;
}

function handleAnswer(selectedChoice) {
  const item = getCurrentItem();
  if (state.answers[item.serial]) return;

  const isCorrect = selectedChoice === item.answer;
  state.answers[item.serial] = {
    selected: selectedChoice,
    correct: isCorrect,
  };

  renderQuestion();
}

function goNext() {
  const atLast = state.currentIndex === state.quizItems.length - 1;
  if (atLast) {
    showResult();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
}

function goPrev() {
  if (state.currentIndex === 0) return;
  state.currentIndex -= 1;
  renderQuestion();
}

function showResult() {
  const total = state.quizItems.length;
  const correct = Object.values(state.answers).filter((entry) => entry && entry.correct).length;
  const rate = total ? Math.round((correct / total) * 100) : 0;

  finalScoreText.textContent = `${correct} / ${total} 問正解`;
  finalRateText.textContent = `正答率：${rate}%`;
  showScreen(resultScreen);
}

function restartSameSettings() {
  startQuiz();
}

function backToMenu(resetRange = false) {
  if (resetRange) {
    startNumberInput.value = QUIZ_META.min;
    endNumberInput.value = QUIZ_META.max;
  } else {
    startNumberInput.value = state.start;
    endNumberInput.value = state.end;
  }
  showScreen(menuScreen);
}

function speakCurrentWord() {
  const item = getCurrentItem();
  if (!item || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(item.word);
  utterance.lang = "en-US";
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}

orderedBtn.addEventListener("click", () => setMode("ordered"));
randomBtn.addEventListener("click", () => setMode("random"));
startQuizBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", goPrev);
nextBtn.addEventListener("click", goNext);
restartSameBtn.addEventListener("click", restartSameSettings);
restartNewBtn.addEventListener("click", () => backToMenu(true));
restartSameResultBtn.addEventListener("click", restartSameSettings);
restartNewResultBtn.addEventListener("click", () => backToMenu(true));
speakBtn.addEventListener("click", speakCurrentWord);
menuBackButtons.forEach((button) => {
  button.addEventListener("click", () => backToMenu(false));
});

showScreen(menuScreen);
setMode("ordered");

}
