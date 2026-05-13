(() => {
  "use strict";

  if (!window.__authOK) return;

  const WORD_DATA = Array.isArray(window.WORD_DATA) ? window.WORD_DATA : [];
  const ids = WORD_DATA.map((item) => Number(item.id)).filter(Number.isFinite);
  const QUIZ_META = window.QUIZ_META || {
    min: Math.min(...ids),
    max: Math.max(...ids),
    title: "Vocabulary Quiz",
  };

  const $ = (id) => document.getElementById(id);

  const menuScreen = $("menuScreen");
  const quizScreen = $("quizScreen");
  const resultScreen = $("resultScreen");

  const startNumberInput = $("startNumber");
  const endNumberInput = $("endNumber");
  const orderedBtn = $("orderedBtn");
  const randomBtn = $("randomBtn");
  const startQuizBtn = $("startQuizBtn");

  const progressText = $("progressText");
  const scoreText = $("scoreText");
  const progressFill = $("progressFill");
  const wordNoText = $("wordNoText");
  const wordText = $("wordText");
  const speakBtn = $("speakBtn");
  const choicesWrap = $("choiceList");
  const feedbackBox = $("feedbackBox");

  const prevBtn = $("prevBtn");
  const nextBtn = $("nextBtn");
  const restartBtn = $("restartBtn");
  const retryBtn = $("retryBtn");
  const menuBtnTop = $("menuBtnTop");

  const restartBtnResult = $("restartBtnResult");
  const retryBtnResult = $("retryBtnResult");
  const menuBtnResult = $("menuBtnResult");
  const finalScore = $("finalScore");
  const finalMessage = $("finalMessage");

  const requiredElements = [
    menuScreen, quizScreen, resultScreen, startNumberInput, endNumberInput,
    orderedBtn, randomBtn, startQuizBtn, progressText, scoreText, progressFill,
    wordNoText, wordText, speakBtn, choicesWrap, feedbackBox, prevBtn, nextBtn,
    restartBtn, retryBtn, menuBtnTop, restartBtnResult, retryBtnResult, menuBtnResult,
    finalScore, finalMessage,
  ];

  if (!WORD_DATA.length || requiredElements.some((el) => !el)) {
    alert("必要なデータまたはHTML要素が不足しています。index.html / data.js / script.js を同じフォルダに置いてください。");
    return;
  }

  startNumberInput.min = String(QUIZ_META.min);
  startNumberInput.max = String(QUIZ_META.max);
  startNumberInput.value = String(QUIZ_META.min);
  endNumberInput.min = String(QUIZ_META.min);
  endNumberInput.max = String(QUIZ_META.max);
  endNumberInput.value = String(QUIZ_META.max);

  const state = {
    start: QUIZ_META.min,
    end: QUIZ_META.max,
    mode: "ordered",
    quizItems: [],
    currentIndex: 0,
    answers: {},
  };

  function normalizeItem(item) {
    const answer = item.choices[item.correct];
    return {
      id: Number(item.id),
      word: item.word,
      choices: item.choices,
      correctIndex: Number(item.correct),
      answer,
      sentence: item.sentence || "",
      jp: item.jp || "",
    };
  }

  const normalizedData = WORD_DATA.map(normalizeItem).filter((item) => {
    return Number.isInteger(item.id)
      && typeof item.word === "string"
      && Array.isArray(item.choices)
      && item.choices.length === 4
      && Number.isInteger(item.correctIndex)
      && item.correctIndex >= 0
      && item.correctIndex < item.choices.length;
  });

  function showScreen(target) {
    [menuScreen, quizScreen, resultScreen].forEach((screen) => {
      screen.classList.toggle("hidden", screen !== target);
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

  function buildQuizItems() {
    const filtered = normalizedData.filter((item) => item.id >= state.start && item.id <= state.end);
    return state.mode === "random" ? shuffleArray(filtered) : filtered;
  }

  function getCurrentItem() {
    return state.quizItems[state.currentIndex];
  }

  function updateScoreText() {
    const answers = Object.values(state.answers);
    const correct = answers.filter((entry) => entry.correct).length;
    scoreText.textContent = `正解 ${correct} / ${answers.length}`;
  }

  function updateProgress() {
    const total = state.quizItems.length || 1;
    const current = Math.min(state.currentIndex + 1, total);
    progressText.textContent = `${current} / ${total}`;
    progressFill.style.width = `${Math.round((current / total) * 100)}%`;
  }

  function hideFeedback() {
    feedbackBox.className = "feedback hidden";
    feedbackBox.innerHTML = "";
  }

  function showFeedback(item, isCorrect) {
    feedbackBox.className = `feedback ${isCorrect ? "correct-state" : "wrong-state"}`;
    feedbackBox.innerHTML = `
      <strong>${isCorrect ? "正解！" : "不正解"}</strong><br>
      正解：${item.answer}（単語番号: ${item.id}）<br>
      <span>${item.sentence}</span><br>
      <span>${item.jp}</span>
    `;
  }

  function handleAnswer(selectedChoice) {
    const item = getCurrentItem();
    if (!item || state.answers[item.id]) return;

    state.answers[item.id] = {
      selected: selectedChoice,
      correct: selectedChoice === item.answer,
    };
    renderQuestion();
  }

  function createChoiceButton(choiceText, item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.textContent = choiceText;

    const answerState = state.answers[item.id];
    if (answerState) {
      button.disabled = true;
      button.classList.add("locked");
      if (choiceText === item.answer) button.classList.add("correct");
      if (choiceText === answerState.selected && choiceText !== item.answer) button.classList.add("wrong");
    }

    button.addEventListener("click", () => handleAnswer(choiceText));
    return button;
  }

  function renderQuestion() {
    const item = getCurrentItem();
    if (!item) return;

    updateProgress();
    updateScoreText();
    wordNoText.textContent = `単語番号: ${item.id}`;
    wordText.textContent = item.word;
    choicesWrap.innerHTML = "";
    item.choices.forEach((choice) => choicesWrap.appendChild(createChoiceButton(choice, item)));

    const answerState = state.answers[item.id];
    if (answerState) showFeedback(item, answerState.correct);
    else hideFeedback();

    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.textContent = state.currentIndex === state.quizItems.length - 1 ? "結果を見る" : "次へ";
  }

  function startQuiz() {
    const range = validateRange();
    if (!range) return;

    state.start = range.start;
    state.end = range.end;
    state.currentIndex = 0;
    state.answers = {};
    state.quizItems = buildQuizItems();

    if (!state.quizItems.length) {
      alert("指定された範囲に問題がありません。");
      return;
    }

    renderQuestion();
    showScreen(quizScreen);
  }

  function goNext() {
    if (state.currentIndex >= state.quizItems.length - 1) {
      showResult();
      return;
    }
    state.currentIndex += 1;
    renderQuestion();
  }

  function goPrev() {
    if (state.currentIndex <= 0) return;
    state.currentIndex -= 1;
    renderQuestion();
  }

  function showResult() {
    const total = state.quizItems.length;
    const correct = Object.values(state.answers).filter((entry) => entry.correct).length;
    const rate = total ? Math.round((correct / total) * 100) : 0;
    finalScore.textContent = `${correct} / ${total} 問正解`;
    finalMessage.textContent = `正答率：${rate}%`;
    showScreen(resultScreen);
  }

  function backToMenu(resetRange = false) {
    if (resetRange) {
      startNumberInput.value = String(QUIZ_META.min);
      endNumberInput.value = String(QUIZ_META.max);
    } else {
      startNumberInput.value = String(state.start);
      endNumberInput.value = String(state.end);
    }
    showScreen(menuScreen);
  }

  function speakCurrentWord() {
    const item = getCurrentItem();
    if (!item || !("speechSynthesis" in window)) return;
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
  restartBtn.addEventListener("click", startQuiz);
  retryBtn.addEventListener("click", () => backToMenu(true));
  menuBtnTop.addEventListener("click", () => backToMenu(false));
  restartBtnResult.addEventListener("click", startQuiz);
  retryBtnResult.addEventListener("click", () => backToMenu(true));
  menuBtnResult.addEventListener("click", () => backToMenu(false));
  speakBtn.addEventListener("click", speakCurrentWord);

  showScreen(menuScreen);
  setMode("ordered");
})();
