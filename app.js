(() => {
  "use strict";

  const META = window.QUIZ_META ?? { modules: [], total: 0 };
  const QUESTIONS = Array.isArray(window.QUIZ_QUESTIONS) ? window.QUIZ_QUESTIONS : [];
  const STORAGE_KEY = "iot-quiz-state-v2";

  const MODES = [
    { id: "all", label: "全部题目", icon: "library-big" },
    { id: "sample", label: "样章已核实", icon: "badge-check" },
    { id: "wrong", label: "错题本", icon: "circle-x" },
    { id: "marked", label: "收藏题目", icon: "star" },
  ];

  const TYPE_LABELS = {
    single: "单选题",
    multiple: "多选题",
    judgment: "判断题",
    scenario: "综合应用题",
  };

  const saved = readStorage();
  const state = {
    mode: validMode(saved.mode) ? saved.mode : "all",
    module: typeof saved.module === "string" ? saved.module : "",
    source: ["", "sample", "toc", "supplement"].includes(saved.source) ? saved.source : "",
    type: ["", "single", "multiple", "judgment", "scenario"].includes(saved.type) ? saved.type : "",
    search: typeof saved.search === "string" ? saved.search : "",
    currentId: typeof saved.currentId === "string" ? saved.currentId : "",
    studyMode: saved.studyMode === "study" ? "study" : "practice",
    onlyUnanswered: Boolean(saved.onlyUnanswered),
    answers: saved.answers && typeof saved.answers === "object" ? saved.answers : {},
    marked: new Set(Array.isArray(saved.marked) ? saved.marked : []),
    theme: saved.theme === "dark" ? "dark" : "light",
    sessionStart: Number(saved.sessionStart) || Date.now(),
    imageZoom: 1,
    leftDrawerOpen: false,
    rightDrawerOpen: false,
  };

  const elements = {
    leftSidebar: document.getElementById("leftSidebar"),
    rightSidebar: document.getElementById("rightSidebar"),
    modeList: document.getElementById("modeList"),
    moduleList: document.getElementById("moduleList"),
    moduleCount: document.getElementById("moduleCount"),
    sampleTotal: document.getElementById("sampleTotal"),
    questionTotal: document.getElementById("questionTotal"),
    searchInput: document.getElementById("searchInput"),
    clearSearchButton: document.getElementById("clearSearchButton"),
    studyModeSwitch: document.getElementById("studyModeSwitch"),
    randomButton: document.getElementById("randomButton"),
    moduleFilter: document.getElementById("moduleFilter"),
    sourceFilter: document.getElementById("sourceFilter"),
    typeFilter: document.getElementById("typeFilter"),
    resetFiltersButton: document.getElementById("resetFiltersButton"),
    resultCount: document.getElementById("resultCount"),
    questionStage: document.getElementById("questionStage"),
    questionShell: document.querySelector(".question-shell"),
    questionMeta: document.getElementById("questionMeta"),
    questionHeading: document.getElementById("questionHeading"),
    questionStem: document.getElementById("questionStem"),
    figurePanel: document.getElementById("figurePanel"),
    figurePreviewButton: document.getElementById("figurePreviewButton"),
    figureImage: document.getElementById("figureImage"),
    figureCaption: document.getElementById("figureCaption"),
    answerArea: document.getElementById("answerArea"),
    feedbackPanel: document.getElementById("feedbackPanel"),
    feedbackIcon: document.getElementById("feedbackIcon"),
    feedbackTitle: document.getElementById("feedbackTitle"),
    feedbackAnswer: document.getElementById("feedbackAnswer"),
    feedbackExplanation: document.getElementById("feedbackExplanation"),
    feedbackMeta: document.getElementById("feedbackMeta"),
    selfGrade: document.getElementById("selfGrade"),
    retryButton: document.getElementById("retryButton"),
    markButton: document.getElementById("markButton"),
    copyQuestionButton: document.getElementById("copyQuestionButton"),
    prevButton: document.getElementById("prevButton"),
    submitButton: document.getElementById("submitButton"),
    nextButton: document.getElementById("nextButton"),
    questionPosition: document.getElementById("questionPosition"),
    topProgressText: document.getElementById("topProgressText"),
    topProgressBar: document.getElementById("topProgressBar"),
    topProgressTrack: document.getElementById("topProgressTrack"),
    mockStatus: document.getElementById("mockStatus"),
    timerText: document.getElementById("timerText"),
    themeButton: document.getElementById("themeButton"),
    sheetTitle: document.getElementById("sheetTitle"),
    answeredCount: document.getElementById("answeredCount"),
    correctCount: document.getElementById("correctCount"),
    wrongCount: document.getElementById("wrongCount"),
    answerGrid: document.getElementById("answerGrid"),
    unansweredButton: document.getElementById("unansweredButton"),
    finishButton: document.getElementById("finishButton"),
    leftDrawerButton: document.getElementById("leftDrawerButton"),
    leftDrawerClose: document.getElementById("leftDrawerClose"),
    answerDrawerButton: document.getElementById("answerDrawerButton"),
    rightDrawerClose: document.getElementById("rightDrawerClose"),
    drawerOverlay: document.getElementById("drawerOverlay"),
    mobilePrevButton: document.getElementById("mobilePrevButton"),
    mobileSubmitButton: document.getElementById("mobileSubmitButton"),
    mobileAnswerButton: document.getElementById("mobileAnswerButton"),
    mobileNextButton: document.getElementById("mobileNextButton"),
    imageModal: document.getElementById("imageModal"),
    imageModalTitle: document.getElementById("imageModalTitle"),
    closeImageModal: document.getElementById("closeImageModal"),
    modalImage: document.getElementById("modalImage"),
    imageScroll: document.getElementById("imageScroll"),
    zoomOutButton: document.getElementById("zoomOutButton"),
    zoomInButton: document.getElementById("zoomInButton"),
    zoomResetButton: document.getElementById("zoomResetButton"),
    zoomLabel: document.getElementById("zoomLabel"),
    resultModal: document.getElementById("resultModal"),
    closeResultModal: document.getElementById("closeResultModal"),
    resultScore: document.getElementById("resultScore"),
    resultDetails: document.getElementById("resultDetails"),
    continuePracticeButton: document.getElementById("continuePracticeButton"),
    reviewWrongButton: document.getElementById("reviewWrongButton"),
    toastRegion: document.getElementById("toastRegion"),
    resetProgressButton: document.getElementById("resetProgressButton"),
  };

  const stateLookup = new Map(QUESTIONS.map((q) => [q.id, q]));
  const deepLinkId = new URLSearchParams(window.location.search).get("q");
  if (deepLinkId && stateLookup.has(deepLinkId)) {
    state.currentId = deepLinkId;
    state.mode = "all";
    state.module = "";
    state.source = "";
    state.type = "";
    state.search = "";
    state.onlyUnanswered = false;
  }

  function readStorage() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function validMode(mode) {
    return MODES.some((item) => item.id === mode);
  }

  function persist() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        mode: state.mode,
        module: state.module,
        source: state.source,
        type: state.type,
        search: state.search,
        currentId: state.currentId,
        studyMode: state.studyMode,
        onlyUnanswered: state.onlyUnanswered,
        answers: state.answers,
        marked: Array.from(state.marked),
        theme: state.theme,
        sessionStart: state.sessionStart,
      }),
    );
  }

  function refreshIcons() {
    if (window.lucide?.createIcons) {
      window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
    }
  }

  function createIcon(name, size = 18) {
    const icon = document.createElement("i");
    icon.dataset.lucide = name;
    icon.setAttribute("aria-hidden", "true");
    icon.style.width = `${size}px`;
    icon.style.height = `${size}px`;
    return icon;
  }

  function createTextElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    element.textContent = text;
    return element;
  }

  function isAnswered(id) {
    const answer = state.answers[id];
    return Boolean(answer?.submitted);
  }

  function isWrong(id) {
    return state.answers[id]?.correct === false;
  }

  function isCorrect(id) {
    return state.answers[id]?.correct === true;
  }

  function normalizeSet(value) {
    if (Array.isArray(value)) return value.map(String);
    return value === undefined || value === null || value === "" ? [] : [String(value)];
  }

  function baseForMode(mode) {
    switch (mode) {
      case "sample":
        return QUESTIONS.filter((q) => q.evidence === "sample");
      case "wrong":
        return QUESTIONS.filter((q) => isWrong(q.id));
      case "marked":
        return QUESTIONS.filter((q) => state.marked.has(q.id));
      default:
        return QUESTIONS.slice();
    }
  }

  function filteredQuestions({ ignoreModule = false, ignoreOnlyUnanswered = false } = {}) {
    let items = baseForMode(state.mode);
    if (!ignoreModule && state.module) items = items.filter((q) => q.module === state.module);
    if (state.source) items = items.filter((q) => q.evidence === state.source);
    if (state.type) items = items.filter((q) => q.type === state.type);
    if (state.search.trim()) {
      const needle = state.search.trim().toLowerCase();
      items = items.filter((q) =>
        `${q.stem} ${q.knowledge} ${q.moduleName} ${q.project} ${q.task} ${q.evidenceLabel} ${q.typeLabel}`
          .toLowerCase()
          .includes(needle),
      );
    }
    if (!ignoreOnlyUnanswered && state.onlyUnanswered) {
      items = items.filter((q) => !isAnswered(q.id));
    }
    return items;
  }

  function currentList() {
    return filteredQuestions();
  }

  function currentQuestion() {
    const items = currentList();
    if (!items.length) return null;
    let found = items.find((q) => q.id === state.currentId);
    if (!found) {
      found = items[0];
      state.currentId = found.id;
    }
    return found;
  }

  function currentPosition(items = currentList()) {
    const index = items.findIndex((q) => q.id === state.currentId);
    return index >= 0 ? index : 0;
  }

  function renderSidebar() {
    elements.modeList.replaceChildren();
    for (const mode of MODES) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "mode-button" + (state.mode === mode.id ? " active" : "");
      button.dataset.mode = mode.id;
      button.append(createIcon(mode.icon, 16));
      button.append(createTextElement("span", "", mode.label));
      button.append(createTextElement("span", "mode-count", String(baseForMode(mode.id).length)));
      button.addEventListener("click", () => {
        state.mode = mode.id;
        state.onlyUnanswered = false;
        state.currentId = "";
        closeDrawers();
        persist();
        renderAll();
      });
      elements.modeList.append(button);
    }

    elements.moduleList.replaceChildren();
    for (const module of META.modules || []) {
      const count = baseForMode(state.mode).filter((q) => q.module === module.id).length;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "course-button" + (state.module === module.id ? " active" : "");
      button.dataset.module = module.id;
      button.title = module.name;
      button.append(createTextElement("span", "", module.shortLabel || module.name));
      button.append(createTextElement("span", "course-count", String(count)));
      button.addEventListener("click", () => {
        state.module = state.module === module.id ? "" : module.id;
        state.currentId = "";
        closeDrawers();
        persist();
        renderAll();
      });
      elements.moduleList.append(button);
    }

    elements.moduleCount.textContent = `${(META.modules || []).length} 个`;
    elements.sampleTotal.textContent = String(META.evidenceCounts?.sample || 0);
    elements.questionTotal.textContent = String(META.total || 0);
  }

  function renderFilters() {
    elements.searchInput.value = state.search;
    elements.clearSearchButton.classList.toggle("visible", Boolean(state.search));
    elements.moduleFilter.value = state.module;
    elements.sourceFilter.value = state.source;
    elements.typeFilter.value = state.type;
    elements.studyModeSwitch.querySelectorAll("[data-study-mode]").forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.studyMode === state.studyMode));
    });
    elements.unansweredButton.classList.toggle("is-active", state.onlyUnanswered);
    const unansweredLabel = Array.from(elements.unansweredButton.childNodes).find(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    if (unansweredLabel) unansweredLabel.textContent = state.onlyUnanswered ? " 查看全部" : " 只看未答";
    const mode = MODES.find((item) => item.id === state.mode) || MODES[0];
    elements.mockStatus.textContent = state.studyMode === "study" ? "背题模式" : `${mode.label}`;
  }

  function metaChip(text, className = "") {
    return createTextElement("span", `meta-chip ${className}`.trim(), text);
  }

  function renderQuestion() {
    const items = currentList();
    const q = currentQuestion();
    const empty = document.getElementById("dynamicEmptyState");
    if (!q) {
      elements.questionShell.hidden = true;
      elements.answerGrid.replaceChildren();
      if (!empty) {
        const box = document.createElement("div");
        box.id = "dynamicEmptyState";
        box.className = "question-shell empty-state";
        const inner = document.createElement("div");
        inner.className = "empty-state-inner";
        inner.append(createIcon("search-x", 38));
        inner.append(createTextElement("strong", "", "当前筛选下没有题目"));
        inner.append(createTextElement("span", "", "切换练习模式、课程或题型后再试。"));
        box.append(inner);
        elements.questionStage.append(box);
      }
      elements.questionPosition.textContent = "第 0 / 0 题";
      elements.prevButton.disabled = true;
      elements.nextButton.disabled = true;
      elements.submitButton.disabled = true;
      elements.markButton.disabled = true;
      elements.copyQuestionButton.disabled = true;
      updateProgress(items);
      renderAnswerGrid(items, null);
      renderScore(items);
      persist();
      refreshIcons();
      return;
    }

    empty?.remove();
    elements.questionShell.hidden = false;
    const position = currentPosition(items);
    const answer = state.answers[q.id];
    const showAnswer = state.studyMode === "study" || Boolean(answer?.submitted);

    elements.questionMeta.replaceChildren();
    elements.questionMeta.append(metaChip(q.moduleName, "primary"));
    elements.questionMeta.append(metaChip(q.task));
    elements.questionMeta.append(metaChip(q.difficulty, q.difficulty === "难题" ? "warning" : ""));
    elements.questionMeta.append(metaChip(q.evidenceLabel, `evidence-${q.evidence}`));

    elements.questionHeading.replaceChildren(
      createTextElement("h1", "question-number-title", `第 ${q.number} 题`),
      createTextElement("span", "question-kind", q.typeLabel),
    );
    elements.questionStem.textContent = q.stem;


    elements.figurePanel.hidden = !q.image;
    if (q.image) {
      elements.figureImage.src = q.image;
      elements.figureImage.alt = q.imageLabel || `${q.moduleName}题图`;
      elements.figureCaption.textContent = `${q.imageLabel}${q.sourcePage ? ` · ${q.sourcePage}` : ""}`;
    } else {
      elements.figureImage.removeAttribute("src");
    }

    renderAnswerArea(q, answer, showAnswer);
    renderFeedback(q, answer, showAnswer);

    elements.questionPosition.textContent = `第 ${position + 1} / ${items.length} 题`;
    elements.prevButton.disabled = position <= 0;
    elements.nextButton.disabled = position >= items.length - 1;
    elements.submitButton.disabled = showAnswer;
    elements.submitButton.textContent = showAnswer ? "已提交" : "提交答案";
    elements.markButton.disabled = false;
    elements.copyQuestionButton.disabled = false;
    elements.markButton.classList.toggle("is-active", state.marked.has(q.id));
    elements.markButton.setAttribute("aria-pressed", String(state.marked.has(q.id)));
    elements.markButton.setAttribute("aria-label", state.marked.has(q.id) ? "取消收藏" : "收藏本题");
    elements.markButton.innerHTML = `<i data-lucide="${state.marked.has(q.id) ? "star-off" : "star"}" aria-hidden="true"></i>`;
    elements.mobileSubmitButton.disabled = showAnswer;
    elements.mobileSubmitButton.textContent = showAnswer ? "已提交" : "提交";
    elements.sheetTitle.textContent = MODES.find((item) => item.id === state.mode)?.label || "全部题目";
    updateProgress(items);
    renderAnswerGrid(items, q.id);
    renderScore(items);
    persist();
    refreshIcons();
  }

  function renderAnswerArea(q, answer, showAnswer) {
    elements.answerArea.replaceChildren();
    const isMulti = q.type === "multiple";
    const selectedKeys = normalizeSet(answer?.value);
    const correctKeys = normalizeSet(q.answer);
    const options = document.createElement("div");
    options.className = "options" + (isMulti ? " multi-options" : "");
    for (const choice of q.choices) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "option-button";
      button.dataset.option = choice.key;
      const isSelected = selectedKeys.includes(choice.key);
      const correct = showAnswer && correctKeys.includes(choice.key);
      const wrong = showAnswer && isSelected && !correctKeys.includes(choice.key);
      if (isSelected) button.classList.add("selected");
      if (correct) button.classList.add("correct");
      if (wrong) button.classList.add("wrong");
      button.disabled = showAnswer;
      button.setAttribute("aria-pressed", String(isSelected));
      button.append(createTextElement("span", "option-letter", choice.key));
      button.append(createTextElement("span", "option-text", choice.text));
      const mark = document.createElement("span");
      mark.className = "option-mark";
      if (correct) mark.append(createIcon("check", 18));
      else if (wrong) mark.append(createIcon("x", 18));
      else if (isMulti && isSelected) mark.append(createIcon("check", 18));
      button.append(mark);
      button.addEventListener("click", () => {
        if (state.studyMode === "study" || state.answers[q.id]?.submitted) return;
        const previous = state.answers[q.id] || {};
        let value;
        if (isMulti) {
          value = selectedKeys.includes(choice.key)
            ? selectedKeys.filter((key) => key !== choice.key)
            : [...selectedKeys, choice.key].sort();
        } else {
          value = choice.key;
        }
        state.answers[q.id] = { ...previous, value, submitted: false, correct: null };
        persist();
        renderAll();
      });
      options.append(button);
    }
    elements.answerArea.append(options);
    if (isMulti && !showAnswer) {
      elements.answerArea.append(
        createTextElement("div", "answer-hint", "多选题：可选择多个选项，提交后按选项集合判定。"),
      );
    }
  }

  function renderFeedback(q, answer, showAnswer) {
    if (!showAnswer) {
      elements.feedbackPanel.hidden = true;
      elements.feedbackPanel.className = "feedback-panel";
      return;
    }
    elements.feedbackPanel.hidden = false;
    const correct = answer?.correct;
    elements.feedbackPanel.className = "feedback-panel";
    if (correct === true) elements.feedbackPanel.classList.add("correct-feedback");
    if (correct === false) elements.feedbackPanel.classList.add("wrong-feedback");

    let iconName = "book-open";
    let title = "参考答案";
    if (state.studyMode !== "study" && correct === true) {
      iconName = "circle-check";
      title = "回答正确";
    } else if (state.studyMode !== "study" && correct === false) {
      iconName = "circle-x";
      title = "回答错误";
    }
    elements.feedbackIcon.replaceChildren(createIcon(iconName, 20));
    elements.feedbackTitle.textContent = title;
    elements.feedbackAnswer.textContent = normalizeSet(q.answer).join("、");
    elements.feedbackExplanation.textContent =
      q.explanation || "题库暂无补充解析，请结合参考答案和知识点复习。";

    elements.feedbackMeta.replaceChildren();
    if (q.evidenceLabel) elements.feedbackMeta.append(metaChip(`依据：${q.evidenceLabel}`, `evidence-${q.evidence}`));
    if (q.project) elements.feedbackMeta.append(metaChip(q.project));
    if (q.task) elements.feedbackMeta.append(metaChip(q.task));
    if (q.knowledge) elements.feedbackMeta.append(metaChip(`知识点：${q.knowledge}`));
    if (q.source) elements.feedbackMeta.append(metaChip(q.source));

    elements.selfGrade.hidden = true;
    elements.retryButton.hidden = state.studyMode === "study";
    elements.selfGrade.querySelectorAll("[data-self-grade]").forEach((button) => {
      button.dataset.currentId = q.id;
    });
  }

  function renderAnswerGrid(items, activeId) {
    elements.answerGrid.replaceChildren();
    const fragment = document.createDocumentFragment();
    for (const q of items) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "answer-bubble";
      button.textContent = String(q.number);
      button.title = `${q.moduleName} · ${q.task} · ${q.typeLabel}`;
      button.setAttribute("aria-label", `第 ${q.number} 题，${q.moduleName}，${q.typeLabel}`);
      if (q.id === activeId) button.classList.add("current");
      if (isCorrect(q.id)) button.classList.add("correct");
      else if (isWrong(q.id)) button.classList.add("wrong");
      else if (isAnswered(q.id)) button.classList.add("answered");
      if (state.marked.has(q.id)) button.classList.add("marked");
      button.addEventListener("click", () => {
        state.currentId = q.id;
        persist();
        closeDrawers();
        renderAll();
        elements.questionStage.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      fragment.append(button);
    }
    elements.answerGrid.append(fragment);
  }

  function renderScore(items) {
    const answered = items.filter((q) => isAnswered(q.id)).length;
    const correct = items.filter((q) => isCorrect(q.id)).length;
    const wrong = items.filter((q) => isWrong(q.id)).length;
    elements.answeredCount.textContent = String(answered);
    elements.correctCount.textContent = String(correct);
    elements.wrongCount.textContent = String(wrong);
  }

  function updateProgress(items = currentList()) {
    const answered = items.filter((q) => isAnswered(q.id)).length;
    const percentage = items.length ? Math.round((answered / items.length) * 100) : 0;
    elements.topProgressText.textContent = `进度 ${answered} / ${items.length}`;
    elements.topProgressBar.style.width = `${percentage}%`;
    elements.topProgressTrack.setAttribute("aria-valuenow", String(percentage));
    elements.resultCount.textContent = `${items.length} 题`;
  }

  function renderAll() {
    renderSidebar();
    renderFilters();
    renderQuestion();
  }

  function commitAnswer() {
    const q = currentQuestion();
    if (!q) return;
    if (state.studyMode === "study") return;
    const previous = state.answers[q.id] || {};
    let correct;
    if (q.type === "multiple") {
      const actual = normalizeSet(previous.value).slice().sort();
      const expected = normalizeSet(q.answer).slice().sort();
      if (!actual.length) {
        showToast("请至少选择一个选项");
        return;
      }
      correct =
        actual.length === expected.length &&
        actual.every((key, index) => key === expected[index]);
    } else {
      if (!previous.value) {
        showToast("请先选择一个选项");
        return;
      }
      correct = previous.value === q.answer;
    }
    state.answers[q.id] = { ...previous, submitted: true, correct };
    persist();
    renderAll();
  }

  function moveQuestion(direction) {
    const items = currentList();
    const index = currentPosition(items);
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= items.length) {
      showToast(direction < 0 ? "已经是第一题" : "已经是最后一题");
      return;
    }
    state.currentId = items[nextIndex].id;
    persist();
    renderAll();
    elements.questionStage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function randomQuestion() {
    const items = currentList();
    if (!items.length) {
      showToast("当前筛选下没有题目");
      return;
    }
    const candidates = items.length > 1 ? items.filter((q) => q.id !== state.currentId) : items;
    const next = candidates[Math.floor(Math.random() * candidates.length)];
    state.currentId = next.id;
    persist();
    renderAll();
    elements.questionStage.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleMark() {
    const q = currentQuestion();
    if (!q) return;
    if (state.marked.has(q.id)) {
      state.marked.delete(q.id);
      showToast("已取消收藏");
    } else {
      state.marked.add(q.id);
      showToast("已收藏本题");
    }
    persist();
    renderAll();
  }

  async function copyQuestion() {
    const q = currentQuestion();
    if (!q) return;
    const choices = q.choices.map((choice) => `${choice.key}. ${choice.text}`).join("\n");
    const text = [
      `【${q.moduleName}｜${q.typeLabel}｜${q.difficulty}】`,
      `${q.project} · ${q.task}`,
      q.stem,
      choices,
      `依据：${q.evidenceLabel}`,
    ]
      .filter(Boolean)
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      showToast("题目已复制");
    } catch {
      showToast("浏览器未允许复制，请手动选择文本");
    }
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    elements.toastRegion.append(toast);
    window.setTimeout(() => toast.remove(), 2200);
  }

  function openDrawer(side) {
    if (side === "left") {
      state.leftDrawerOpen = true;
      elements.leftSidebar.classList.add("open");
    } else {
      state.rightDrawerOpen = true;
      elements.rightSidebar.classList.add("open");
    }
    elements.drawerOverlay.hidden = false;
  }

  function closeDrawers() {
    state.leftDrawerOpen = false;
    state.rightDrawerOpen = false;
    elements.leftSidebar.classList.remove("open");
    elements.rightSidebar.classList.remove("open");
    elements.drawerOverlay.hidden = true;
  }

  function openImageModal() {
    const q = currentQuestion();
    if (!q?.image) return;
    state.imageZoom = 1;
    elements.modalImage.src = q.fullImage || q.image;
    elements.modalImage.alt = q.imageLabel || "原题大图";
    elements.modalImage.style.width = "100%";
    elements.imageModalTitle.textContent = q.imageLabel || `${q.moduleName}题图`;
    elements.zoomLabel.textContent = "100%";
    elements.imageModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.imageScroll.scrollTo({ top: 0, left: 0 });
    elements.closeImageModal.focus();
  }

  function closeImageModal() {
    elements.imageModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function adjustZoom(delta) {
    state.imageZoom = Math.min(2.5, Math.max(0.75, state.imageZoom + delta));
    elements.modalImage.style.width = `${Math.round(state.imageZoom * 100)}%`;
    elements.zoomLabel.textContent = `${Math.round(state.imageZoom * 100)}%`;
  }

  function showResult() {
    const items = currentList();
    const answered = items.filter((q) => isAnswered(q.id)).length;
    const correct = items.filter((q) => isCorrect(q.id)).length;
    const wrong = items.filter((q) => isWrong(q.id)).length;
    const pending = items.filter((q) => isAnswered(q.id) && state.answers[q.id]?.correct == null).length;
    const unanswered = items.length - answered;
    const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
    elements.resultScore.replaceChildren(
      createTextElement("strong", "", `${correct}`),
      createTextElement("span", "", `/${answered} 已答 · 正确率 ${accuracy}%`),
    );
    elements.resultDetails.replaceChildren();
    for (const [label, value] of [
      ["全部题目", items.length],
      ["未作答", unanswered],
      ["错误", wrong],
      ["待自评", pending],
      ["收藏", items.filter((q) => state.marked.has(q.id)).length],
    ]) {
      const cell = document.createElement("div");
      cell.append(createTextElement("strong", "", String(value)));
      cell.append(createTextElement("span", "", label));
      elements.resultDetails.append(cell);
    }
    elements.reviewWrongButton.disabled = wrong === 0;
    elements.resultModal.hidden = false;
    document.body.classList.add("modal-open");
    elements.closeResultModal.focus();
  }

  function closeResult() {
    elements.resultModal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function updateTheme() {
    document.documentElement.dataset.theme = state.theme;
    elements.themeButton.innerHTML = `<i data-lucide="${state.theme === "dark" ? "sun" : "moon"}" aria-hidden="true"></i>`;
    elements.themeButton.setAttribute("aria-label", state.theme === "dark" ? "切换到浅色主题" : "切换到深色主题");
    refreshIcons();
  }

  function updateTimer() {
    const elapsed = Math.max(0, Math.floor((Date.now() - state.sessionStart) / 1000));
    const minutes = String(Math.floor(elapsed / 60)).padStart(2, "0");
    const seconds = String(elapsed % 60).padStart(2, "0");
    elements.timerText.textContent = `${minutes}:${seconds}`;
  }

  function resetProgress() {
    if (!window.confirm("确定清空全部作答记录和收藏吗？")) return;
    state.answers = {};
    state.marked.clear();
    state.currentId = "";
    state.onlyUnanswered = false;
    state.sessionStart = Date.now();
    persist();
    renderAll();
    showToast("作答记录已清空");
  }

  function bindEvents() {
    elements.searchInput.addEventListener("input", () => {
      state.search = elements.searchInput.value;
      state.currentId = "";
      persist();
      renderAll();
    });
    elements.clearSearchButton.addEventListener("click", () => {
      state.search = "";
      elements.searchInput.value = "";
      elements.searchInput.focus();
      persist();
      renderAll();
    });

    elements.moduleFilter.addEventListener("change", () => {
      state.module = elements.moduleFilter.value;
      state.currentId = "";
      persist();
      renderAll();
    });
    elements.sourceFilter.addEventListener("change", () => {
      state.source = elements.sourceFilter.value;
      state.currentId = "";
      persist();
      renderAll();
    });
    elements.typeFilter.addEventListener("change", () => {
      state.type = elements.typeFilter.value;
      state.currentId = "";
      persist();
      renderAll();
    });
    elements.resetFiltersButton.addEventListener("click", () => {
      state.module = "";
      state.source = "";
      state.type = "";
      state.search = "";
      state.onlyUnanswered = false;
      state.currentId = "";
      persist();
      renderAll();
    });

    elements.studyModeSwitch.addEventListener("click", (event) => {
      const button = event.target.closest("[data-study-mode]");
      if (!button) return;
      state.studyMode = button.dataset.studyMode;
      persist();
      renderAll();
    });

    elements.randomButton.addEventListener("click", randomQuestion);
    elements.prevButton.addEventListener("click", () => moveQuestion(-1));
    elements.nextButton.addEventListener("click", () => moveQuestion(1));
    elements.mobilePrevButton.addEventListener("click", () => moveQuestion(-1));
    elements.mobileNextButton.addEventListener("click", () => moveQuestion(1));
    elements.submitButton.addEventListener("click", commitAnswer);
    elements.mobileSubmitButton.addEventListener("click", commitAnswer);
    elements.markButton.addEventListener("click", toggleMark);
    elements.copyQuestionButton.addEventListener("click", copyQuestion);
    elements.retryButton.addEventListener("click", () => {
      const q = currentQuestion();
      if (!q) return;
      delete state.answers[q.id];
      persist();
      renderAll();
    });
    elements.selfGrade.addEventListener("click", (event) => {
      const button = event.target.closest("[data-self-grade]");
      if (!button) return;
      const q = currentQuestion();
      if (!q) return;
      const current = state.answers[q.id] || {};
      state.answers[q.id] = { ...current, correct: button.dataset.selfGrade === "correct" };
      persist();
      renderAll();
    });

    elements.figurePreviewButton.addEventListener("click", openImageModal);
    elements.closeImageModal.addEventListener("click", closeImageModal);
    elements.imageModal.addEventListener("click", (event) => {
      if (event.target === elements.imageModal) closeImageModal();
    });
    elements.zoomOutButton.addEventListener("click", () => adjustZoom(-0.25));
    elements.zoomInButton.addEventListener("click", () => adjustZoom(0.25));
    elements.zoomResetButton.addEventListener("click", () => {
      state.imageZoom = 1;
      elements.modalImage.style.width = "100%";
      elements.zoomLabel.textContent = "100%";
    });

    elements.themeButton.addEventListener("click", () => {
      state.theme = state.theme === "dark" ? "light" : "dark";
      persist();
      updateTheme();
    });

    elements.unansweredButton.addEventListener("click", () => {
      state.onlyUnanswered = !state.onlyUnanswered;
      state.currentId = "";
      persist();
      renderAll();
    });
    elements.finishButton.addEventListener("click", showResult);
    elements.closeResultModal.addEventListener("click", closeResult);
    elements.resultModal.addEventListener("click", (event) => {
      if (event.target === elements.resultModal) closeResult();
    });
    elements.continuePracticeButton.addEventListener("click", closeResult);
    elements.reviewWrongButton.addEventListener("click", () => {
      closeResult();
      state.mode = "wrong";
      state.module = "";
      state.source = "";
      state.type = "";
      state.search = "";
      state.onlyUnanswered = false;
      state.currentId = "";
      persist();
      renderAll();
    });

    elements.leftDrawerButton.addEventListener("click", () => openDrawer("left"));
    elements.answerDrawerButton.addEventListener("click", () => openDrawer("right"));
    elements.mobileAnswerButton.addEventListener("click", () => openDrawer("right"));
    elements.leftDrawerClose.addEventListener("click", closeDrawers);
    elements.rightDrawerClose.addEventListener("click", closeDrawers);
    elements.drawerOverlay.addEventListener("click", closeDrawers);
    elements.resetProgressButton.addEventListener("click", resetProgress);

    document.addEventListener("keydown", (event) => {
      if (event.target.matches("input, textarea, select")) return;
      if (event.key === "Escape") {
        if (!elements.imageModal.hidden) closeImageModal();
        else if (!elements.resultModal.hidden) closeResult();
        else closeDrawers();
        return;
      }
      if (!elements.imageModal.hidden || !elements.resultModal.hidden) return;
      if (["ArrowLeft", "a", "A"].includes(event.key)) {
        event.preventDefault();
        moveQuestion(-1);
      } else if (["ArrowRight", "d", "D"].includes(event.key)) {
        event.preventDefault();
        moveQuestion(1);
      } else if (["Enter"].includes(event.key)) {
        event.preventDefault();
        if (!elements.submitButton.disabled) commitAnswer();
      } else if (["b", "B", "c", "C"].includes(event.key)) {
        const q = currentQuestion();
        if (!q) return;
        const key = event.key.toUpperCase();
        const button = elements.answerArea.querySelector(`[data-option="${key}"]`);
        button?.click();
      }
    });
  }

  function initModuleOptions() {
    const all = document.createElement("option");
    all.value = "";
    all.textContent = "全部模块";
    elements.moduleFilter.append(all);
    for (const module of META.modules || []) {
      const option = document.createElement("option");
      option.value = module.id;
      option.textContent = module.name;
      elements.moduleFilter.append(option);
    }
  }

  function init() {
    document.documentElement.dataset.theme = state.theme;
    initModuleOptions();
    bindEvents();
    updateTheme();
    setInterval(updateTimer, 1000);
    updateTimer();
    renderAll();
    refreshIcons();
  }

  init();
})();
