// =====================================================================
// Логіка форми заявки на головній сторінці.
// Кожна відправлена заявка зберігається у Firestore, у колекцію "orders".
// Переглянути заявки можна на сторінці admin.html після входу.
// =====================================================================

const db = firebase.firestore();

const form = document.getElementById("orderForm");
const formMsg = document.getElementById("formMsg");

// Якщо на сторінку прийшли з посилання виду contact.html?interest=Вінки —
// одразу підставляємо потрібний варіант у список.
(function preselectInterest() {
  const params = new URLSearchParams(window.location.search);
  const wanted = params.get("interest");
  const select = document.getElementById("interest");
  if (wanted && select) {
    for (const opt of select.options) {
      if (opt.value === wanted || opt.textContent.trim() === wanted) {
        select.value = opt.value;
        break;
      }
    }
  }
})();

form.addEventListener("submit", function (e) {
  e.preventDefault();

  const name = document.getElementById("name").value.trim();
  const phone = document.getElementById("phone").value.trim();
  const interest = document.getElementById("interest").value;
  const message = document.getElementById("message").value.trim();

  if (!name || !phone) {
    showMsg("Будь ласка, заповніть ім'я та телефон.", true);
    return;
  }

  const submitBtn = form.querySelector("button[type=submit]");
  submitBtn.disabled = true;
  submitBtn.textContent = "Надсилаємо...";

  const cartData = JSON.parse(localStorage.getItem("decor_cart")) || [];
  
  db.collection("orders").add({
    name: name,
    phone: phone,
    interest: interest,
    message: message,
    cart: cartData, // Додаємо кошик
    status: "new",
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
  .then(function () {
    showMsg("Дякуємо! Ваша заявка надіслана — ми скоро з вами зв'яжемось. 🎄", false);
    form.reset();
    localStorage.removeItem("decor_cart"); // Очистити кошик
    if (typeof updateCartUI === "function") {
      cart = [];
      updateCartUI();
    }
  })
  .catch(function (error) {
    console.error("Помилка при відправці заявки:", error);
    showMsg("Щось пішло не так. Спробуйте ще раз або напишіть нам напряму в Instagram.", true);
  })
  .finally(function () {
    submitBtn.disabled = false;
    submitBtn.textContent = "Надіслати заявку";
  });
});

function showMsg(text, isError) {
  formMsg.textContent = text;
  formMsg.className = isError ? "err" : "ok";
}
