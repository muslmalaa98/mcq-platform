import { getQuestions } from "../api.js";
import { formatSubSupSafe } from "../format.js";
import { loadLastQuestionIndex, saveLastQuestionIndex } from "../storage.js";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export function Reader(el, state, { college, stage, term, course, subject }) {
  // ✅ تنظيف أي listeners قديمة لهذا العنصر (مهم جدًا مع التنقل)
  if (el.__readerAbort) el.__readerAbort.abort();
  const abort = new AbortController();
  el.__readerAbort = abort;

  const pathKey = `${college}/${stage}/${term}/${course}/${subject}`;

  el.innerHTML = `
    <div class="rotate-hint" id="rotateHint" style="display:none;">
      الأفضل تدوير الجهاز للوضع الأفقي (Landscape) لتجربة أفضل 📱↔️
    </div>

    <div class="reader">
      <div class="question-box" id="qbox">
        <div class="q-meta">
          <div id="qtitle">Loading...</div>
          <div id="qcount"></div>
        </div>

        <div class="q-text" id="qtext"></div>

        <div class="options" id="opts"></div>

        <div class="answer" id="answer" style="display:none;">
          <p class="answer-title">Answer</p>
          <p class="answer-text" id="explain"></p>
        </div>
      </div>

      <div class="sidepanel">
        <div class="row" style="justify-content:space-between;">
          <button class="btn" id="prev">Prev</button>
          <button class="btn" id="show">Show Answer</button>
          <button class="btn" id="next">Next</button>
        </div>

        <div style="height:12px;"></div>

        <div class="progress"><div id="bar"></div></div>
        <div class="row" style="justify-content:space-between; margin-top:10px;">
          <span class="small" id="ptext"></span>
          <span class="small">Jump:</span>
          <input class="input" id="jump" style="width:110px; padding:10px;" placeholder="e.g. 12" inputmode="numeric"/>
          <button class="btn" id="go">Go</button>
        </div>

        <div style="height:10px;"></div>
        <div class="small">
          💾 يتم حفظ آخر سؤال محليًا لهذا الجهاز (لن تُحفظ درجات أو نتائج).
        </div>
      </div>
    </div>
  `;

  const rotateHint = el.querySelector("#rotateHint");

  const qtitle = el.querySelector("#qtitle");
  const qcount = el.querySelector("#qcount");
  const qtext = el.querySelector("#qtext");
  const opts = el.querySelector("#opts");
  const answerBox = el.querySelector("#answer");
  const explain = el.querySelector("#explain");
  const bar = el.querySelector("#bar");
  const ptext = el.querySelector("#ptext");
  const jump = el.querySelector("#jump");

  const prevBtn = el.querySelector("#prev");
  const nextBtn = el.querySelector("#next");
  const showBtn = el.querySelector("#show");
  const goBtn = el.querySelector("#go");

  let questions = [];
  let idx = clamp(loadLastQuestionIndex(pathKey), 0, 0);

  // ✅ لإظهار/إخفاء صندوق الشرح فقط
  let showAnswer = false;

  // ✅ اختيار الطالب (مؤقت داخل السؤال الحالي)
  let selectedKey = null; // مثل "A" / "B" / "C" / "D"
  let revealed = false;   // بعد أول ضغطة: نكشف ونقفل التغيير

  function updateRotateHint() {
    if (!rotateHint) return;
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const isSmall = window.matchMedia("(max-width: 900px)").matches;
    rotateHint.style.display = (isPortrait && isSmall) ? "block" : "none";
  }

  window.addEventListener("resize", updateRotateHint, { signal: abort.signal });
  updateRotateHint();

  function resetPerQuestionState() {
    showAnswer = false;
    selectedKey = null;
    revealed = false;
    showBtn.textContent = "Show Answer";
  }

  function render() {
    const total = questions.length;
    const q = questions[idx];

    qtitle.textContent = state.structure?.meta?.appTitle || "MCQ Reader";
    qcount.textContent = total ? `Q ${idx + 1} / ${total}` : "";

    const percent = total ? ((idx + 1) / total) * 100 : 0;
    bar.style.width = `${percent}%`;
    ptext.textContent = total ? `Progress: ${Math.round(percent)}%` : "";

    if (!q) {
      qtext.innerHTML = "";
      opts.innerHTML = "";
      answerBox.style.display = "none";
      explain.innerHTML = "";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }

    qtext.innerHTML = formatSubSupSafe(q.q);

    // ✅ الكشف يحصل إذا:
    // 1) الطالب اختار خيار (revealed)
    // 2) أو ضغط Show Answer (showAnswer)
    const shouldReveal = revealed || showAnswer;

    opts.innerHTML = (q.options || []).map((o) => {
      const isSelected = selectedKey === o.k;
      const isCorrect = shouldReveal && o.k === q.correct;
      const isWrong = shouldReveal && isSelected && o.k !== q.correct;

      const cls = [
        "option",
        isSelected ? "selected" : "",
        isCorrect ? "correct" : "",
        isWrong ? "wrong" : ""
      ].filter(Boolean).join(" ");

      return `
        <button
          type="button"
          class="${cls}"
          data-key="${o.k}"
          ${revealed ? "disabled" : ""}
          dir="ltr"
        >
          <strong>${o.k}.</strong>
          <span>${formatSubSupSafe(o.text)}</span>
        </button>
      `;
    }).join("");

    // ✅ صندوق الشرح (فقط يتحكم به showAnswer)
    if (showAnswer) {
      answerBox.style.display = "block";
      explain.innerHTML = q.explanation
        ? formatSubSupSafe(q.explanation)
        : "No explanation provided.";
      showBtn.textContent = "Hide Answer";
    } else {
      answerBox.style.display = "none";
      explain.innerHTML = "";
      showBtn.textContent = "Show Answer";
    }

    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= total - 1;

    saveLastQuestionIndex(pathKey, idx);
  }

  function setIndex(next) {
    idx = clamp(next, 0, Math.max(0, questions.length - 1));
    resetPerQuestionState();
    render();
  }

  // ✅ اختيار خيار = كشف فوري + قفل
  opts.addEventListener("click", (e) => {
    const btn = e.target.closest(".option");
    if (!btn) return;

    const key = btn.dataset.key;
    if (!key) return;

    if (revealed) return; // لا نسمح بتغيير الاختيار بعد الكشف

    selectedKey = key;
    revealed = true;
    // (اختياري) نخلي الشرح يظهر مباشرة بعد الاختيار
    showAnswer = true;

    render();
  }, { signal: abort.signal });

  prevBtn.addEventListener("click", () => setIndex(idx - 1), { signal: abort.signal });
  nextBtn.addEventListener("click", () => setIndex(idx + 1), { signal: abort.signal });

  showBtn.addEventListener("click", () => {
    showAnswer = !showAnswer;
    render();
  }, { signal: abort.signal });

  goBtn.addEventListener("click", () => {
    const n = Number(jump.value);
    if (!Number.isFinite(n) || n < 1) return;
    setIndex(n - 1);
  }, { signal: abort.signal });

  jump.addEventListener("keydown", (e) => {
    if (e.key === "Enter") goBtn.click();
  }, { signal: abort.signal });

  (async () => {
    try {
      const data = await getQuestions({ college, stage, term, course, subject });
      questions = data.questions || [];
      idx = clamp(loadLastQuestionIndex(pathKey), 0, Math.max(0, questions.length - 1));
      resetPerQuestionState();
      render();
    } catch (e) {
      el.innerHTML = `
        <div class="card">
          <div class="card-body">
            <h2 class="card-title">تعذر تحميل الأسئلة</h2>
            <p class="card-sub">${e?.message || "Unknown error"}</p>
            <button class="btn" onclick="location.hash='#/colleges'">رجوع</button>
          </div>
        </div>
      `;
    }
  })();
}
