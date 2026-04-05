const state = {
  mode: "order",
  filtered: [],
  currentIndex: 0,
  responses: [],
  rangeStart: 401,
  rangeEnd: 500,
};

const screens = {
  menu: document.getElementById("menuScreen"),
  quiz: document.getElementById("quizScreen"),
  result: document.getElementById("resultScreen"),
};

const startInput = document.getElementById("startNumber");
const endInput = document.getElementById("endNumber");
const modeButtons = document.querySelectorAll(".mode-btn");
const startBtn = document.getElementById("startBtn");

const progressText = document.getElementById("progressText");
const scoreText = document.getElementById("scoreText");
const progressFill = document.getElementById("progressFill");
const wordText = document.getElementById("wordText");
const choiceList = document.getElementById("choiceList");
const feedbackBox = document.getElementById("feedbackBox");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");
const retryBtn = document.getElementById("retryBtn");
const menuBtnTop = document.getElementById("menuBtnTop");
const restartBtnResult = document.getElementById("restartBtnResult");
const retryBtnResult = document.getElementById("retryBtnResult");
const menuBtnResult = document.getElementById("menuBtnResult");
const finalScore = document.getElementById("finalScore");
const finalMessage = document.getElementById("finalMessage");
const speakBtn = document.getElementById("speakBtn");

modeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    modeButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");
    state.mode = button.dataset.mode;
  });
});

startBtn.addEventListener("click", startQuiz);
prevBtn.addEventListener("click", showPrevious);
nextBtn.addEventListener("click", showNext);
restartBtn.addEventListener("click", restartSameCondition);
retryBtn.addEventListener("click", goToMenu);
menuBtnTop.addEventListener("click", goToMenu);
restartBtnResult.addEventListener("click", restartSameCondition);
retryBtnResult.addEventListener("click", goToMenu);
menuBtnResult.addEventListener("click", goToMenu);
speakBtn.addEventListener("click", speakWord);

function showScreen(name) {
  Object.values(screens).forEach((screen) => screen.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

function startQuiz() {
  const start = Number(startInput.value);
  const end = Number(endInput.value);

  if (Number.isNaN(start) || Number.isNaN(end) || start > end) {
    alert("開始番号と終了番号を正しく入力してください。");
    return;
  }
  if (start < 401 || end > 500) {
    alert("このページでは 401〜500 の範囲を指定してください。");
    return;
  }

  state.rangeStart = start;
  state.rangeEnd = end;
  state.filtered = data.filter((item) => item.id >= start && item.id <= end);

  if (state.mode === "random") {
    state.filtered = shuffle(state.filtered.slice());
  }

  state.currentIndex = 0;
  state.responses = state.filtered.map(() => null);

  if (state.filtered.length === 0) {
    alert("指定範囲にデータがありません。");
    return;
  }

  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  const item = state.filtered[state.currentIndex];
  const response = state.responses[state.currentIndex];

  progressText.textContent = `${state.currentIndex + 1} / ${state.filtered.length}`;
  scoreText.textContent = `正解 ${getScore()} / ${countAnswered()}`;
  progressFill.style.width = `${((state.currentIndex + 1) / state.filtered.length) * 100}%`;

  wordText.textContent = item.word;
  choiceList.innerHTML = "";
  feedbackBox.className = "feedback hidden";
  feedbackBox.innerHTML = "";

  item.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.textContent = `${index + 1}. ${choice}`;

    if (response !== null) {
      button.classList.add("locked");
      if (index === item.correct) button.classList.add("correct");
      if (index === response && response !== item.correct) button.classList.add("wrong");
    } else {
      button.addEventListener("click", () => selectChoice(index));
    }

    choiceList.appendChild(button);
  });

  if (response !== null) {
    showFeedback(item, response === item.correct);
  }

  prevBtn.disabled = state.currentIndex === 0;
  nextBtn.textContent = state.currentIndex === state.filtered.length - 1 ? "結果を見る" : "次へ";
}

function selectChoice(index) {
  if (state.responses[state.currentIndex] !== null) return;
  state.responses[state.currentIndex] = index;
  renderQuestion();
}

function showFeedback(item, isCorrect) {
  feedbackBox.classList.remove("hidden");
  feedbackBox.classList.add(isCorrect ? "correct-state" : "wrong-state");

  const answerText = item.choices[item.correct];
  feedbackBox.innerHTML = `
    <strong>${isCorrect ? "⭕ 正解" : "❌ 不正解"}</strong><br>
    正解：${answerText}<br><br>
    <div><strong>例文</strong><br>${escapeHtml(item.sentence)}</div>
    <div style="margin-top:8px;"><strong>和訳</strong><br>${escapeHtml(item.jp)}</div>
  `;
}

function showPrevious() {
  if (state.currentIndex > 0) {
    state.currentIndex -= 1;
    renderQuestion();
  }
}

function showNext() {
  if (state.currentIndex === state.filtered.length - 1) {
    showResult();
    return;
  }
  state.currentIndex += 1;
  renderQuestion();
}

function showResult() {
  const score = getScore();
  finalScore.textContent = `${score} / ${state.filtered.length}`;
  const rate = Math.round((score / state.filtered.length) * 100);
  finalMessage.textContent = `正答率 ${rate}% でした。もう一度挑戦できます。`;
  showScreen("result");
}

function restartSameCondition() {
  if (!state.filtered.length) return;
  const start = state.rangeStart;
  const end = state.rangeEnd;
  state.filtered = data.filter((item) => item.id >= start && item.id <= end);
  if (state.mode === "random") {
    state.filtered = shuffle(state.filtered.slice());
  }
  state.currentIndex = 0;
  state.responses = state.filtered.map(() => null);
  showScreen("quiz");
  renderQuestion();
}

function goToMenu() {
  showScreen("menu");
}

function getScore() {
  return state.responses.reduce((sum, response, index) => {
    if (response === null) return sum;
    return sum + (response === state.filtered[index].correct ? 1 : 0);
  }, 0);
}

function countAnswered() {
  return state.responses.filter((value) => value !== null).length;
}

function speakWord() {
  const item = state.filtered[state.currentIndex];
  if (!item) return;
  const utterance = new SpeechSynthesisUtterance(item.word);
  utterance.lang = "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function shuffle(array) {
  const copied = array.slice();
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
