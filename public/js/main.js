// =====================================================================
// Загальний скрипт сайту decor_rizdvo:
// - мобільне меню (гамбургер)
// - підсвітка активного пункту меню
// - плавна поява блоків при прокрутці (reveal)
// - легкий сніжок у "темних" секціях (canvas)
// - рік у футері
// =====================================================================

document.addEventListener("DOMContentLoaded", function () {

  // ---------- Мобільне меню ----------
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      const isOpen = nav.classList.toggle("open");
      toggle.classList.toggle("open", isOpen);
      toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.classList.remove("open");
      });
    });
  }

  // ---------- Активний пункт меню ----------
  const currentPage = (location.pathname.split("/").pop() || "index.html");
  document.querySelectorAll(".site-nav a").forEach(function (link) {
    const href = link.getAttribute("href");
    if (href === currentPage || (currentPage === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });

  // ---------- Reveal при прокрутці ----------
  const revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && revealEls.length) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("visible"); });
  }

  // ---------- Рік у футері ----------
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---------- Сніжок ----------
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".snow-layer").forEach(function (canvas) {
    if (prefersReducedMotion) return;
    initSnow(canvas);
  });
});

function initSnow(canvas) {
  const ctx = canvas.getContext("2d");
  let width, height, flakes;

  function resize() {
    const parent = canvas.parentElement;
    width = canvas.width = parent.offsetWidth;
    height = canvas.height = parent.offsetHeight;
  }

  function makeFlakes() {
    const count = Math.max(18, Math.floor(width / 40));
    flakes = [];
    for (let i = 0; i < count; i++) {
      flakes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        speed: Math.random() * 0.6 + 0.25,
        drift: Math.random() * 0.6 - 0.3,
        opacity: Math.random() * 0.5 + 0.3
      });
    }
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#f1e2bb";
    flakes.forEach(function (f) {
      ctx.globalAlpha = f.opacity;
      ctx.beginPath();
      ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
      ctx.fill();
      f.y += f.speed;
      f.x += f.drift;
      if (f.y > height) { f.y = -4; f.x = Math.random() * width; }
      if (f.x > width) f.x = 0;
      if (f.x < 0) f.x = width;
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  resize();
  makeFlakes();
  window.addEventListener("resize", function () { resize(); makeFlakes(); });
  requestAnimationFrame(tick);
}
