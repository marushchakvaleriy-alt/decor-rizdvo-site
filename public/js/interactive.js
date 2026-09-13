/**
 * decor_rizdvo — Interactive Features & Festive Atmosphere Engine
 * Shimmer, Sparkles, Before/After Slider, Decor Quiz, Countdown & Holiday Ambience
 */

(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    initSparkles();
    init3DTilt();
    initBeforeAfterSlider();
    initDecorQuiz();
    initCountdownTimer();
    initAudioMood();
  });

  // =========================================================================
  // 1. Sparkle Particles Effect on Hover/Click
  // =========================================================================
  function initSparkles() {
    let lastSparkleTime = 0;
    const sparkleChars = ["✦", "✧", "✨", "❄️", "⭐"];

    function createSparkle(x, y) {
      const now = Date.now();
      if (now - lastSparkleTime < 60) return; // throttle
      lastSparkleTime = now;

      const p = document.createElement("span");
      p.className = "sparkle-particle";
      p.textContent = sparkleChars[Math.floor(Math.random() * sparkleChars.length)];

      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * 35 + 15;
      const dx = Math.cos(angle) * dist + "px";
      const dy = Math.sin(angle) * dist - 25 + "px";
      const rot = (Math.random() * 180 - 90) + "deg";

      p.style.left = x + "px";
      p.style.top = y + "px";
      p.style.setProperty("--dx", dx);
      p.style.setProperty("--dy", dy);
      p.style.setProperty("--rot", rot);

      document.body.appendChild(p);
      setTimeout(() => p.remove(), 850);
    }

    document.addEventListener("mousemove", function (e) {
      const target = e.target.closest(".btn, .btn-tryon-pill, .ar-chip, .clock-box, .quiz-opt-btn");
      if (target) {
        createSparkle(e.clientX, e.clientY);
      }
    });

    document.addEventListener("click", function (e) {
      const target = e.target.closest(".btn, .btn-tryon-pill, .quiz-opt-btn");
      if (target) {
        for (let i = 0; i < 4; i++) {
          setTimeout(() => createSparkle(e.clientX, e.clientY), i * 70);
        }
      }
    });
  }

  // =========================================================================
  // 2. 3D Tilt Effect on Cards
  // =========================================================================
  function init3DTilt() {
    if (window.matchMedia("(max-width: 768px)").matches) return;

    const cards = document.querySelectorAll(".card, .review-card, .value-card");
    cards.forEach(card => {
      card.style.transition = "transform 0.15s ease-out, box-shadow 0.25s ease";

      card.addEventListener("mousemove", function (e) {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener("mouseleave", function () {
        card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
      });
    });
  }

  // =========================================================================
  // 3. Before & After Split Slider
  // =========================================================================
  function initBeforeAfterSlider() {
    const slider = document.getElementById("baSlider");
    if (!slider) return;

    let isDown = false;

    function setSplit(clientX) {
      const rect = slider.getBoundingClientRect();
      let pos = clientX - rect.left;
      let pct = (pos / rect.width) * 100;
      pct = Math.max(5, Math.min(95, pct));
      slider.style.setProperty("--split-pos", pct + "%");
    }

    // Default start at 50%
    slider.style.setProperty("--split-pos", "50%");

    slider.addEventListener("pointerdown", function (e) {
      isDown = true;
      slider.setPointerCapture(e.pointerId);
      setSplit(e.clientX);
    });

    slider.addEventListener("pointermove", function (e) {
      if (!isDown) return;
      setSplit(e.clientX);
    });

    function endPointer() {
      isDown = false;
    }

    slider.addEventListener("pointerup", endPointer);
    slider.addEventListener("pointercancel", endPointer);
  }

  // =========================================================================
  // 4. Decor Quiz Engine
  // =========================================================================
  function initDecorQuiz() {
    const quizCard = document.getElementById("quizCard");
    if (!quizCard) return;

    const quizData = {
      step: 1,
      answers: { place: "", style: "", size: "" }
    };

    const PRODUCTS_MAP = {
      "ruby": {
        id: "wreath-ruby",
        name: "Рубіновий вінок «Різдвяне Диво»",
        price: "1 850 грн",
        desc: "Ідеальний вибір: розкішний оксамит, яскраві рубінові акценти та тепле святкове світло для ваших дверей.",
        img: "img/ar/wreath-ruby.png",
        order: "Ексклюзивний вінок Рубінове Диво"
      },
      "gold": {
        id: "wreath-gold",
        name: "Золотий святковий вінок",
        price: "1 750 грн",
        desc: "Тепле сяйво новорічних вогників, вишукані золоті банти та благородні кулі для затишної оселі.",
        img: "img/ar/wreath-gold.png",
        order: "Новорічний вінок (Золотий)"
      },
      "snowy": {
        id: "wreath-snowy",
        name: "Засніжений хвойний вінок",
        price: "1 650 грн",
        desc: "Атмосфера казкового зимового лісу: пухнастий іній, сріблясті кульки та евкаліпт.",
        img: "img/ar/wreath-snowy.png",
        order: "Новорічний вінок (Засніжений)"
      },
      "table": {
        id: "tree-65cm",
        name: "Ялинка зі штучної гілки (65 см)",
        price: "1 450 грн",
        desc: "Найкраще рішення для столу чи каміна: компактна форма, стійка основа в натуральному джуті та тепле сяйво.",
        img: "img/ar/tree-65cm.png",
        order: "Ялинка зі штучної гілки 65 см"
      },
      "classic": {
        id: "wreath-classic",
        name: "Класичний різдвяний вінок",
        price: "1 550 грн",
        desc: "Традиційний хвойний вінок з лісовими шишками, корицею, сушеними цитрусами та червоними ягодами.",
        img: "img/ar/wreath-classic.png",
        order: "Новорічний вінок (Класичний)"
      }
    };

    window.handleQuizAnswer = function (category, value) {
      quizData.answers[category] = value;
      quizData.step++;
      renderQuiz();
    };

    window.resetQuiz = function () {
      quizData.step = 1;
      quizData.answers = { place: "", style: "", size: "" };
      renderQuiz();
    };

    function renderQuiz() {
      const step = quizData.step;
      const barFill = document.getElementById("quizBarFill");
      const stepIndicator = document.getElementById("quizStepIndicator");
      const content = document.getElementById("quizContent");

      if (step === 1) {
        if (barFill) barFill.style.width = "33%";
        if (stepIndicator) stepIndicator.textContent = "Крок 1 з 3";
        content.innerHTML = `
          <h3 class="quiz-question-title">Куди саме ви обираєте декор?</h3>
          <p class="quiz-question-sub">Оберіть головне місце, яке хочете наповнити святковою атмосферою</p>
          <div class="quiz-options">
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('place', 'door')">
              <span class="opt-emoji">🚪</span>
              <span>На вхідні або міжкімнатні двері</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('place', 'table')">
              <span class="opt-emoji">🍽️</span>
              <span>На святковий стіл або тумбу</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('place', 'wall')">
              <span class="opt-emoji">🪵</span>
              <span>На камін або головну стіну</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('place', 'gift')">
              <span class="opt-emoji">🎁</span>
              <span>Як особливий теплий подарунок</span>
            </button>
          </div>
        `;
      } else if (step === 2) {
        if (barFill) barFill.style.width = "66%";
        if (stepIndicator) stepIndicator.textContent = "Крок 2 з 3";
        content.innerHTML = `
          <h3 class="quiz-question-title">Який святковий стиль вам найближчий?</h3>
          <p class="quiz-question-sub">Оберіть настрій та колірну палітру, яка пасуватиме інтер'єру</p>
          <div class="quiz-options">
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('style', 'ruby')">
              <span class="opt-emoji">🍷</span>
              <span>Глибокий рубін, оксамит та шик</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('style', 'gold')">
              <span class="opt-emoji">✨</span>
              <span>Тепле золото, вогники та розкіш</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('style', 'snowy')">
              <span class="opt-emoji">❄️</span>
              <span>Засніжений зимовий ліс та срібло</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('style', 'classic')">
              <span class="opt-emoji">🌲</span>
              <span>Класична хвоя, шишки та кориця</span>
            </button>
          </div>
        `;
      } else if (step === 3) {
        if (barFill) barFill.style.width = "100%";
        if (stepIndicator) stepIndicator.textContent = "Крок 3 з 3";
        content.innerHTML = `
          <h3 class="quiz-question-title">Якому розміру ви надаєте перевагу?</h3>
          <p class="quiz-question-sub">Це допоможе визначити ідеальні пропорції для простору</p>
          <div class="quiz-options">
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('size', 'standard')">
              <span class="opt-emoji">📐</span>
              <span>Стандартний затишний (45 см)</span>
            </button>
            <button type="button" class="quiz-opt-btn" onclick="handleQuizAnswer('size', 'large')">
              <span class="opt-emoji">👑</span>
              <span>Парадний великий (50 – 65 см)</span>
            </button>
          </div>
        `;
      } else {
        // РЕЗУЛЬТАТ
        if (barFill) barFill.style.width = "100%";
        if (stepIndicator) stepIndicator.textContent = "✨ Ваш ідеальний вибір";

        // Визначаємо найкращий виріб
        let pickKey = "ruby";
        if (quizData.answers.place === "table") {
          pickKey = "table";
        } else if (quizData.answers.style === "ruby") {
          pickKey = "ruby";
        } else if (quizData.answers.style === "gold") {
          pickKey = "gold";
        } else if (quizData.answers.style === "snowy") {
          pickKey = "snowy";
        } else {
          pickKey = "classic";
        }

        const product = PRODUCTS_MAP[pickKey];

        content.innerHTML = `
          <div class="quiz-result-box">
            <span style="background:var(--berry); color:#fff; font-size:0.75rem; font-weight:bold; padding:4px 12px; border-radius:12px; text-transform:uppercase;">
              🎯 100% відповідність вашим побажанням
            </span>
            <h3 style="color:#fff; font-size:1.5rem; margin:12px 0 6px; font-family:Cambria,Georgia,serif;">
              ${product.name}
            </h3>
            <p style="color:var(--gold-light); font-size:0.95rem; max-width:480px; margin:0 auto 12px; line-height:1.5;">
              ${product.desc}
            </p>
            <img src="${product.img}" alt="${product.name}" class="quiz-result-img" />
            <div style="font-family:Cambria,Georgia,serif; font-size:1.4rem; color:var(--gold); font-weight:bold; margin-bottom:18px;">
              ${product.price}
            </div>
            <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
              <button type="button" class="btn-tryon-pill" data-open-ar="${product.id}" style="background:linear-gradient(135deg, var(--gold) 0%, #a87e2b 100%); color:#14332a; font-weight:800; padding:12px 22px;">
                <span class="pill-cam-ic">📸</span> Приміряти у своїй кімнаті
              </button>
              <a href="contact.html?interest=${encodeURIComponent(product.order)}" class="btn" style="padding:12px 22px;">
                Замовити цей виріб
              </a>
            </div>
            <button type="button" onclick="resetQuiz()" style="background:transparent; border:none; color:rgba(241,226,187,0.75); cursor:pointer; font-size:0.85rem; text-decoration:underline;">
              🔄 Пройти підбір ще раз
            </button>
          </div>
        `;
      }
    }
  }

  // =========================================================================
  // 5. Holiday Countdown Timer
  // =========================================================================
  function initCountdownTimer() {
    const daysEl = document.getElementById("clockDays");
    const hoursEl = document.getElementById("clockHours");
    const minsEl = document.getElementById("clockMins");
    const secsEl = document.getElementById("clockSecs");

    if (!daysEl) return;

    // Встановлюємо цільову дату: День Святого Миколая (6 грудня) або Новий Рік
    const now = new Date();
    let target = new Date(now.getFullYear(), 11, 6, 0, 0, 0); // 6 грудня

    // Якщо 6 грудня вже минуло в поточному році, відраховуємо до Нового року
    if (now > target) {
      target = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    }

    function update() {
      const current = new Date();
      let diff = target - current;

      if (diff <= 0) {
        diff = 0;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / 1000 / 60) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      daysEl.textContent = String(days).padStart(2, "0");
      hoursEl.textContent = String(hours).padStart(2, "0");
      minsEl.textContent = String(mins).padStart(2, "0");
      secsEl.textContent = String(secs).padStart(2, "0");
    }

    update();
    setInterval(update, 1000);
  }

  // =========================================================================
  // 6. Holiday Audio Ambience (Web Audio API: Fireplace & Bells)
  // =========================================================================
  function initAudioMood() {
    let audioCtx = null;
    let isPlaying = false;
    let noiseNode = null;
    let bellInterval = null;

    const btn = document.getElementById("audioMoodBtn");
    if (!btn) return;

    function startAmbience() {
      if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
      }

      if (audioCtx.state === "suspended") {
        audioCtx.resume();
      }

      // 1. Потріскування каміна (Pink noise + bandpass + random pops)
      const bufferSize = audioCtx.sampleRate * 2;
      const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0;

      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        let pink = b0 + b1 + b2 + b3 + white * 0.5362;
        // occasional fire crackle impulse
        if (Math.random() < 0.002) {
          pink += (Math.random() * 4 - 2);
        }
        output[i] = pink * 0.04;
      }

      noiseNode = audioCtx.createBufferSource();
      noiseNode.buffer = noiseBuffer;
      noiseNode.loop = true;

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(650, audioCtx.currentTime);

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.35, audioCtx.currentTime);

      noiseNode.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noiseNode.start();

      // 2. Періодичні святкові передзвони (пентатоніка дзвіночків)
      const bellFreqs = [1046.5, 1318.5, 1567.9, 2093.0, 2349.3]; // C6, E6, G6, C7, D7
      function playChime() {
        if (!isPlaying || !audioCtx) return;
        const freq = bellFreqs[Math.floor(Math.random() * bellFreqs.length)];
        const osc = audioCtx.createOscillator();
        const chimeGain = audioCtx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        chimeGain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        chimeGain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 2.5);

        osc.connect(chimeGain);
        chimeGain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 2.6);
      }

      bellInterval = setInterval(() => {
        if (Math.random() < 0.7) playChime();
      }, 3500);

      isPlaying = true;
      btn.classList.add("playing");
      btn.querySelector(".audio-label").textContent = "Звук свята: грає 🔔";
    }

    function stopAmbience() {
      if (noiseNode) {
        try { noiseNode.stop(); noiseNode.disconnect(); } catch (e) {}
        noiseNode = null;
      }
      if (bellInterval) {
        clearInterval(bellInterval);
        bellInterval = null;
      }
      isPlaying = false;
      btn.classList.remove("playing");
      btn.querySelector(".audio-label").textContent = "Різдвяний настрій 🎵";
    }

    btn.addEventListener("click", function () {
      if (!isPlaying) {
        startAmbience();
      } else {
        stopAmbience();
      }
    });
  }

})();
