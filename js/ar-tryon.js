/**
 * decor_rizdvo — Live Camera AR Decor Try-On
 * Доповнена реальність та віртуальна примірка декору через камеру смартфона
 */

(function () {
  "use strict";

  // База товарів для примірки
  const AR_ITEMS = {
    "wreath-ruby": {
      id: "wreath-ruby",
      name: "Рубіновий вінок «Різдвяне Диво»",
      dim: 50,
      unit: "см",
      orderName: "Ексклюзивний вінок Рубінове Диво",
      img: "img/ar/wreath-ruby.png",
      isTree: false,
      desc: "Оксамитові банти, рубінові кулі та тепле сяйво"
    },
    "wreath-classic": {
      id: "wreath-classic",
      name: "Класичний різдвяний вінок",
      dim: 45,
      unit: "см",
      orderName: "Новорічний вінок (Класичний)",
      img: "img/ar/wreath-classic.png",
      isTree: false,
      desc: "Натуральні шишки, ягоди та кориця"
    },
    "wreath-snowy": {
      id: "wreath-snowy",
      name: "Засніжений хвойний вінок",
      dim: 45,
      unit: "см",
      orderName: "Новорічний вінок (Засніжений)",
      img: "img/ar/wreath-snowy.png",
      isTree: false,
      desc: "Іній, білі ягоди та срібні кульки"
    },
    "wreath-gold": {
      id: "wreath-gold",
      name: "Золотий святковий вінок",
      dim: 50,
      unit: "см",
      orderName: "Новорічний вінок (Золотий)",
      img: "img/ar/wreath-gold.png",
      isTree: false,
      desc: "Золоті банти, вогники та кульки"
    },
    "tree-65cm": {
      id: "tree-65cm",
      name: "Ялинка зі штучної гілки",
      dim: 65,
      unit: "см",
      orderName: "Ялинка зі штучної гілки 65 см",
      img: "img/ar/tree-65cm.png",
      isTree: true,
      desc: "Висота 65 см, джутовий мішечок"
    }
  };

  const SAMPLE_DOOR_IMG = "img/ar/sample-door.jpg";

  // Стан примірки
  let currentItemKey = "wreath-ruby";
  let cameraStream = null;
  let currentFacingMode = "environment"; // за замовчуванням задня камера
  let isUsingSampleBg = false;
  let customBgUrl = null;

  // Трансформація об'єкта
  let posX = 0;
  let posY = 0;
  let scale = 1.0;
  let rotation = 0;

  // Мультитач / жест трекінг
  const activePointers = new Map();
  let initialPinchDistance = null;
  let initialPinchScale = 1.0;
  let initialPinchAngle = null;
  let initialPinchRotation = 0;
  let isDragging = false;
  let lastPointerPos = { x: 0, y: 0 };

  // DOM елементи
  let modalEl, videoEl, backdropImgEl, decorWrapperEl, decorImgEl;
  let sizeSliderEl, sizeDisplayEl, guideBoxEl, toastHintEl;
  let drawerEl, snapshotModalEl, snapshotImgEl;

  // Ініціалізація після завантаження DOM
  document.addEventListener("DOMContentLoaded", initAR);

  function initAR() {
    injectARModalHTML();
    cacheElements();
    bindEvents();
    bindTriggerButtons();
  }

  // Створення розмітки модального вікна
  function injectARModalHTML() {
    if (document.getElementById("arModal")) return;

    const modal = document.createElement("div");
    modal.id = "arModal";
    modal.className = "ar-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-label", "Віртуальна примірка декору");

    modal.innerHTML = `
      <!-- Верхній HUD -->
      <header class="ar-header">
        <div class="ar-brand">
          <span class="ar-logo-icon">🎄</span>
          <span>decor_rizdvo • Примірка</span>
        </div>
        <div class="ar-header-actions">
          <button type="button" class="ar-btn-icon" id="arBtnToggleBg" title="Змінити фон (Камера / Зразок дверей / Своє фото)">
            🖼️
          </button>
          <button type="button" class="ar-btn-icon" id="arBtnFlipCam" title="Перемкнути камеру">
            🔄
          </button>
          <button type="button" class="ar-btn-icon ar-btn-close" id="arBtnClose" title="Закрити">
            ✕
          </button>
        </div>
      </header>

      <!-- Підказка -->
      <div class="ar-toast-hint" id="arToastHint">
        👆 Перетягуйте пальцем • 🤏 Масштабуйте двома пальцями
      </div>

      <!-- Область огляду (Камера / Фото) -->
      <main class="ar-viewport" id="arViewport">
        <video id="arVideo" autoplay playsinline muted></video>
        <img id="arBackdropImg" src="${SAMPLE_DOOR_IMG}" alt="Зразок інтер'єру" style="display:none;" />

        <!-- Орієнтир дверей -->
        <div class="ar-guide-box" id="arGuideBox">
          <span class="ar-guide-label">🚪 Тримайте двері або стіну в центрі</span>
        </div>

        <!-- Інтерактивний декор -->
        <div class="ar-decor-wrapper" id="arDecorWrapper">
          <div class="ar-decor-ring"></div>
          <img class="ar-decor-img" id="arDecorImg" src="${AR_ITEMS[currentItemKey].img}" alt="Декор" draggable="false" />
        </div>
      </main>

      <!-- Нижній HUD -->
      <footer class="ar-footer">
        <!-- Повзунок розміру та інструменти -->
        <div class="ar-tools-row">
          <div class="ar-tool-group">
            <label for="arSizeSlider">📏 Розмір:</label>
            <input type="range" id="arSizeSlider" class="ar-slider" min="0.45" max="1.85" step="0.01" value="1.0" />
            <span class="ar-size-display" id="arSizeDisplay">45 см</span>
          </div>
          <button type="button" class="ar-tool-btn" id="arBtnReset" title="Скинути положення">
            По центру
          </button>
          <button type="button" class="ar-tool-btn" id="arBtnToggleGuide" title="Увімкнути/вимкнути рамку">
            Рамка
          </button>
        </div>

        <!-- Карусель товарів -->
        <div class="ar-carousel" id="arCarousel">
          ${Object.values(AR_ITEMS).map(item => `
            <div class="ar-chip ${item.id === currentItemKey ? 'active' : ''}" data-ar-pick="${item.id}">
              <img src="${item.img}" alt="${item.name}" />
              <div>
                <div class="ar-chip-title">${item.name}</div>
                <div class="ar-chip-dim">Ø ${item.dim} ${item.unit}</div>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Головні дії: Знімок та Замовлення -->
        <div class="ar-actions-row">
          <button type="button" class="ar-btn-snapshot" id="arBtnSnapshot">
            📸 Зробити фото
          </button>
          <a href="contact.html?interest=${encodeURIComponent(AR_ITEMS[currentItemKey].orderName)}" class="ar-btn-order" id="arBtnOrder">
            ✨ Замовити цей виріб
          </a>
        </div>
      </footer>

      <!-- Випадаюче меню фонів (Камера / Зразок / Завантаження) -->
      <div class="ar-drawer" id="arBgDrawer">
        <div class="ar-drawer-header">
          <h3>Оберіть фон для примірки</h3>
          <button type="button" class="ar-tool-btn" id="arCloseBgDrawer">✕</button>
        </div>
        <div class="ar-drawer-options">
          <div class="ar-drawer-opt ${!isUsingSampleBg ? 'selected' : ''}" id="optCam">
            <span class="opt-icon">📷</span>
            <span>Жива камера</span>
          </div>
          <div class="ar-drawer-opt ${isUsingSampleBg ? 'selected' : ''}" id="optDoor">
            <span class="opt-icon">🚪</span>
            <span>Зразок дверей</span>
          </div>
          <label class="ar-drawer-opt" id="optUpload">
            <span class="opt-icon">🖼️</span>
            <span>Своє фото</span>
            <input type="file" id="arFileInput" accept="image/*" style="display:none;" />
          </label>
        </div>
      </div>

      <!-- Модальне вікно готового знімка -->
      <div class="ar-snapshot-modal" id="arSnapshotModal">
        <div class="ar-snapshot-card">
          <div class="ar-snapshot-img-wrap">
            <img id="arSnapshotImg" src="" alt="Фото примірки" />
          </div>
          <div class="ar-snapshot-body">
            <div class="ar-snapshot-title">Чудовий вибір! 🎄</div>
            <div class="ar-snapshot-desc" id="arSnapshotDesc">Вінок ідеально пасує до вашого простору.</div>
            <div class="ar-snapshot-buttons">
              <a id="arBtnDownloadSnap" download="decor_rizdvo_tryon.png" class="ar-btn-snapshot" style="text-decoration:none;">
                💾 Зберегти фото
              </a>
              <button type="button" class="ar-btn-icon ar-btn-close" id="arBtnCloseSnap" title="Повернутися">
                ✕
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  }

  function cacheElements() {
    modalEl = document.getElementById("arModal");
    videoEl = document.getElementById("arVideo");
    backdropImgEl = document.getElementById("arBackdropImg");
    decorWrapperEl = document.getElementById("arDecorWrapper");
    decorImgEl = document.getElementById("arDecorImg");
    sizeSliderEl = document.getElementById("arSizeSlider");
    sizeDisplayEl = document.getElementById("arSizeDisplay");
    guideBoxEl = document.getElementById("arGuideBox");
    toastHintEl = document.getElementById("arToastHint");
    drawerEl = document.getElementById("arBgDrawer");
    snapshotModalEl = document.getElementById("arSnapshotModal");
    snapshotImgEl = document.getElementById("arSnapshotImg");
  }

  function bindEvents() {
    // Закриття
    document.getElementById("arBtnClose").addEventListener("click", closeARTryOn);

    // Зміна камери (фронтальна/задня)
    document.getElementById("arBtnFlipCam").addEventListener("click", function () {
      if (isUsingSampleBg) {
        showToast("Увімкніть режим живої камери, щоб перемикати її 📷");
        return;
      }
      currentFacingMode = (currentFacingMode === "environment") ? "user" : "environment";
      startCamera();
    });

    // Меню вибору фону
    document.getElementById("arBtnToggleBg").addEventListener("click", function () {
      drawerEl.classList.toggle("open");
    });
    document.getElementById("arCloseBgDrawer").addEventListener("click", function () {
      drawerEl.classList.remove("open");
    });

    document.getElementById("optCam").addEventListener("click", function () {
      isUsingSampleBg = false;
      updateBgOptions();
      drawerEl.classList.remove("open");
      startCamera();
    });

    document.getElementById("optDoor").addEventListener("click", function () {
      switchToSampleBg(SAMPLE_DOOR_IMG);
      drawerEl.classList.remove("open");
    });

    document.getElementById("arFileInput").addEventListener("change", function (e) {
      const file = e.target.files && e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
          customBgUrl = evt.target.result;
          switchToSampleBg(customBgUrl);
          drawerEl.classList.remove("open");
        };
        reader.readAsDataURL(file);
      }
    });

    // Повзунок розміру
    sizeSliderEl.addEventListener("input", function () {
      scale = parseFloat(this.value);
      updateTransform();
      updateSizeLabel();
    });

    // Кнопка центрування
    document.getElementById("arBtnReset").addEventListener("click", function () {
      posX = 0;
      posY = 0;
      rotation = 0;
      scale = 1.0;
      sizeSliderEl.value = 1.0;
      updateTransform();
      updateSizeLabel();
      showToast("Положення вирівняно по центру");
    });

    // Рамка орієнтиру
    document.getElementById("arBtnToggleGuide").addEventListener("click", function () {
      guideBoxEl.classList.toggle("hidden");
    });

    // Вибір товару в каруселі
    document.getElementById("arCarousel").addEventListener("click", function (e) {
      const chip = e.target.closest("[data-ar-pick]");
      if (chip) {
        const pickId = chip.getAttribute("data-ar-pick");
        selectProduct(pickId);
      }
    });

    // Створення знімка (Snapshot)
    document.getElementById("arBtnSnapshot").addEventListener("click", captureSnapshot);
    document.getElementById("arBtnCloseSnap").addEventListener("click", function () {
      snapshotModalEl.classList.remove("open");
    });

    // Обробка жестів (Drag, Pinch-to-zoom, Rotate)
    setupGestures();
  }

  // Обробка жестів торкання та миші
  function setupGestures() {
    const viewport = document.getElementById("arViewport");

    viewport.addEventListener("pointerdown", function (e) {
      viewport.setPointerCapture(e.pointerId);
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      decorWrapperEl.classList.add("active-touch");

      if (activePointers.size === 1) {
        isDragging = true;
        lastPointerPos = { x: e.clientX, y: e.clientY };
      } else if (activePointers.size === 2) {
        isDragging = false;
        const [p1, p2] = Array.from(activePointers.values());
        initialPinchDistance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        initialPinchScale = scale;
        initialPinchAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
        initialPinchRotation = rotation;
      }
    });

    viewport.addEventListener("pointermove", function (e) {
      if (!activePointers.has(e.pointerId)) return;
      activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (activePointers.size === 1 && isDragging) {
        const dx = e.clientX - lastPointerPos.x;
        const dy = e.clientY - lastPointerPos.y;
        lastPointerPos = { x: e.clientX, y: e.clientY };

        posX += dx;
        posY += dy;
        updateTransform();
      } else if (activePointers.size === 2 && initialPinchDistance) {
        const [p1, p2] = Array.from(activePointers.values());
        const currentDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        const scaleFactor = currentDist / initialPinchDistance;

        let newScale = initialPinchScale * scaleFactor;
        newScale = Math.min(Math.max(newScale, 0.45), 1.85);
        scale = newScale;
        sizeSliderEl.value = scale;
        updateSizeLabel();

        // Обертання
        const currentAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x) * (180 / Math.PI);
        const angleDiff = currentAngle - initialPinchAngle;
        rotation = initialPinchRotation + angleDiff;

        updateTransform();
      }
    });

    function endPointer(e) {
      activePointers.delete(e.pointerId);
      if (activePointers.size < 2) {
        initialPinchDistance = null;
      }
      if (activePointers.size === 1) {
        const [remaining] = Array.from(activePointers.values());
        lastPointerPos = { x: remaining.x, y: remaining.y };
        isDragging = true;
      } else if (activePointers.size === 0) {
        isDragging = false;
        decorWrapperEl.classList.remove("active-touch");
      }
    }

    viewport.addEventListener("pointerup", endPointer);
    viewport.addEventListener("pointercancel", endPointer);
  }

  function updateTransform() {
    decorWrapperEl.style.transform = `translate3d(${posX}px, ${posY}px, 0) scale(${scale}) rotate(${rotation}deg)`;
  }

  function updateSizeLabel() {
    const item = AR_ITEMS[currentItemKey];
    const currentDimCm = Math.round(item.dim * scale);
    sizeDisplayEl.textContent = `${item.isTree ? '' : 'Ø '}${currentDimCm} ${item.unit}`;
  }

  function selectProduct(key) {
    if (!AR_ITEMS[key]) return;
    currentItemKey = key;
    const item = AR_ITEMS[key];

    // Оновлення картинки з легким ефектом
    decorImgEl.style.opacity = "0.2";
    setTimeout(() => {
      decorImgEl.src = item.img;
      decorImgEl.style.opacity = "1";
    }, 120);

    // Клас для форми (ялинка чи круглий вінок)
    if (item.isTree) {
      decorWrapperEl.classList.add("is-tree");
    } else {
      decorWrapperEl.classList.remove("is-tree");
    }

    // Оновлення активного чіпа
    document.querySelectorAll(".ar-chip").forEach(chip => {
      chip.classList.toggle("active", chip.getAttribute("data-ar-pick") === key);
    });

    // Оновлення кнопки замовлення
    const orderBtn = document.getElementById("arBtnOrder");
    orderBtn.href = `contact.html?interest=${encodeURIComponent(item.orderName)}`;

    updateSizeLabel();
    showToast(`Обрано: ${item.name}`);
  }

  // Запуск камери
  function startCamera() {
    stopCamera();
    isUsingSampleBg = false;
    updateBgOptions();

    backdropImgEl.style.display = "none";
    videoEl.style.display = "block";

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showToast("Камера не підтримується у цьому браузері. Використовуємо зразок інтер'єру.");
      switchToSampleBg(SAMPLE_DOOR_IMG);
      return;
    }

    const constraints = {
      video: {
        facingMode: { ideal: currentFacingMode },
        width: { ideal: 1920 },
        height: { ideal: 1080 }
      },
      audio: false
    };

    navigator.mediaDevices.getUserMedia(constraints)
      .then(function (stream) {
        cameraStream = stream;
        videoEl.srcObject = stream;
        videoEl.play().catch(e => console.log("Play error:", e));
        showToast("Камеру підключено 🎄 Наведіть на двері чи стіну");
      })
      .catch(function (err) {
        console.warn("Camera access denied or error:", err);
        showToast("Немає доступу до камери. Відкрито зразок дверей для примірки.");
        switchToSampleBg(SAMPLE_DOOR_IMG);
      });
  }

  function stopCamera() {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      cameraStream = null;
    }
    if (videoEl) {
      videoEl.srcObject = null;
    }
  }

  function switchToSampleBg(imgUrl) {
    stopCamera();
    isUsingSampleBg = true;
    updateBgOptions();

    videoEl.style.display = "none";
    backdropImgEl.style.display = "block";
    backdropImgEl.src = imgUrl;
    showToast("Встановлено фото інтер'єру 🚪");
  }

  function updateBgOptions() {
    const optCam = document.getElementById("optCam");
    const optDoor = document.getElementById("optDoor");
    if (optCam && optDoor) {
      optCam.classList.toggle("selected", !isUsingSampleBg);
      optDoor.classList.toggle("selected", isUsingSampleBg && backdropImgEl.src.includes("sample-door"));
    }
  }

  function showToast(text) {
    if (!toastHintEl) return;
    toastHintEl.textContent = text;
    toastHintEl.style.opacity = "1";
    clearTimeout(toastHintEl._timer);
    toastHintEl._timer = setTimeout(() => {
      toastHintEl.style.opacity = "0.75";
    }, 3800);
  }

  // Фотознімок (Snapshot)
  function captureSnapshot() {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const viewport = document.getElementById("arViewport");
    const vpRect = viewport.getBoundingClientRect();

    canvas.width = 1080;
    canvas.height = Math.round((vpRect.height / vpRect.width) * 1080);

    const w = canvas.width;
    const h = canvas.height;

    // 1. Малюємо фон (кадр з камери або картинка)
    if (!isUsingSampleBg && videoEl.readyState >= 2) {
      // Обчислюємо object-fit: cover для відео на canvas
      const vRatio = videoEl.videoWidth / videoEl.videoHeight;
      const cRatio = w / h;
      let sx = 0, sy = 0, sw = videoEl.videoWidth, sh = videoEl.videoHeight;

      if (vRatio > cRatio) {
        sw = videoEl.videoHeight * cRatio;
        sx = (videoEl.videoWidth - sw) / 2;
      } else {
        sh = videoEl.videoWidth / cRatio;
        sy = (videoEl.videoHeight - sh) / 2;
      }
      ctx.drawImage(videoEl, sx, sy, sw, sh, 0, 0, w, h);
    } else {
      // Малюємо фото дверей
      const imgRatio = backdropImgEl.naturalWidth / backdropImgEl.naturalHeight;
      const cRatio = w / h;
      let sx = 0, sy = 0, sw = backdropImgEl.naturalWidth, sh = backdropImgEl.naturalHeight;

      if (imgRatio > cRatio) {
        sw = backdropImgEl.naturalHeight * cRatio;
        sx = (backdropImgEl.naturalWidth - sw) / 2;
      } else {
        sh = backdropImgEl.naturalWidth / cRatio;
        sy = (backdropImgEl.naturalHeight - sh) / 2;
      }
      ctx.drawImage(backdropImgEl, sx, sy, sw, sh, 0, 0, w, h);
    }

    // 2. Малюємо виріб на канвасі
    const decorRect = decorWrapperEl.getBoundingClientRect();
    const relCenterX = (decorRect.left + decorRect.width / 2 - vpRect.left) / vpRect.width;
    const relCenterY = (decorRect.top + decorRect.height / 2 - vpRect.top) / vpRect.height;
    const drawCenterX = relCenterX * w;
    const drawCenterY = relCenterY * h;

    const decorRenderW = (decorRect.width / vpRect.width) * w;
    const decorRenderH = (decorRect.height / vpRect.height) * h;

    ctx.save();
    ctx.translate(drawCenterX, drawCenterY);
    ctx.rotate((rotation * Math.PI) / 180);

    // Додаємо реалістичну тінь
    ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 14;

    ctx.drawImage(decorImgEl, -decorRenderW / 2, -decorRenderH / 2, decorRenderW, decorRenderH);
    ctx.restore();

    // 3. Водяний знак decor_rizdvo
    ctx.fillStyle = "rgba(14, 36, 29, 0.85)";
    ctx.fillRect(0, h - 90, w, 90);

    ctx.fillStyle = "#c89b3c";
    ctx.font = "bold 32px Georgia, serif";
    ctx.fillText("🎄 decor_rizdvo", 32, h - 36);

    ctx.fillStyle = "#f1e2bb";
    ctx.font = "24px Calibri, Arial, sans-serif";
    ctx.fillText("Примірка декору в інтер'єрі • Instagram: @decor_rizdvo", 320, h - 38);

    // Виводимо модальне вікно зі знімком
    const snapDataUrl = canvas.toDataURL("image/png");
    snapshotImgEl.src = snapDataUrl;

    const downloadBtn = document.getElementById("arBtnDownloadSnap");
    downloadBtn.href = snapDataUrl;
    downloadBtn.download = `decor_rizdvo_${currentItemKey}.png`;

    const item = AR_ITEMS[currentItemKey];
    document.getElementById("arSnapshotDesc").textContent = `${item.name} у вашому інтер'єрі. Збережіть фото на згадку або оформіть замовлення.`;

    snapshotModalEl.classList.add("open");
  }

  // Відкриття та закриття AR-режиму
  window.openARTryOn = function (itemKey) {
    if (itemKey && AR_ITEMS[itemKey]) {
      selectProduct(itemKey);
    }
    modalEl.classList.add("active");
    document.body.style.overflow = "hidden";
    startCamera();
  };

  window.closeARTryOn = function () {
    modalEl.classList.remove("active");
    snapshotModalEl.classList.remove("open");
    drawerEl.classList.remove("open");
    document.body.style.overflow = "";
    stopCamera();
  };

  // Прив'язка кнопок відкриття на сторінках
  function bindTriggerButtons() {
    document.addEventListener("click", function (e) {
      const trigger = e.target.closest("[data-open-ar]");
      if (trigger) {
        e.preventDefault();
        const itemKey = trigger.getAttribute("data-open-ar") || "wreath-classic";
        window.openARTryOn(itemKey);
      }
    });
  }

})();
