// =====================================================================
// Логіка адмін-панелі: вхід через Firebase Authentication
// та перегляд/обробка заявок з Firestore (колекція "orders").
// =====================================================================

const auth = firebase.auth();
const db = firebase.firestore();

const loginScreen = document.getElementById("loginScreen");
const adminScreen = document.getElementById("adminScreen");
const loginForm = document.getElementById("loginForm");
const loginMsg = document.getElementById("loginMsg");
const logoutBtn = document.getElementById("logoutBtn");
const ordersList = document.getElementById("ordersList");
const emptyMsg = document.getElementById("emptyMsg");
const userEmail = document.getElementById("userEmail");

let unsubscribeOrders = null;

// --- Вхід ---
loginForm.addEventListener("submit", function (e) {
  e.preventDefault();
  loginMsg.textContent = "";
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(function (error) {
      console.error(error);
      loginMsg.textContent = "Невірний email або пароль.";
    });
});

// --- Вихід ---
logoutBtn.addEventListener("click", function () {
  auth.signOut();
});

// --- Стеження за станом входу ---
auth.onAuthStateChanged(function (user) {
  if (user) {
    loginScreen.style.display = "none";
    adminScreen.style.display = "block";
    userEmail.textContent = user.email;
    subscribeToOrders();
  } else {
    loginScreen.style.display = "block";
    adminScreen.style.display = "none";
    if (unsubscribeOrders) {
      unsubscribeOrders();
      unsubscribeOrders = null;
    }
  }
});

// --- Підписка на список заявок у реальному часі ---
function subscribeToOrders() {
  unsubscribeOrders = db.collection("orders")
    .orderBy("createdAt", "desc")
    .onSnapshot(function (snapshot) {
      ordersList.innerHTML = "";

      if (snapshot.empty) {
        emptyMsg.style.display = "block";
        return;
      }
      emptyMsg.style.display = "none";

      snapshot.forEach(function (doc) {
        const order = doc.data();
        ordersList.appendChild(renderOrder(doc.id, order));
      });
    }, function (error) {
      console.error("Помилка завантаження заявок:", error);
      ordersList.innerHTML = "<p>Не вдалося завантажити заявки. Перевірте правила доступу Firestore (README, крок 5).</p>";
    });
}

function renderOrder(id, order) {
  const row = document.createElement("div");
  row.className = "order-row";

  const date = order.createdAt && order.createdAt.toDate
    ? order.createdAt.toDate().toLocaleString("uk-UA")
    : "щойно";

  const statusClass = order.status === "done" ? "done" : "new";
  const statusLabel = order.status === "done" ? "Оброблено" : "Нова";

  row.innerHTML = `
    <div>
      <h4>${escapeHtml(order.name || "Без імені")} <span class="status-pill ${statusClass}">${statusLabel}</span></h4>
      <div class="meta">${escapeHtml(order.phone || "")} · ${escapeHtml(order.interest || "")} · ${date}</div>
      ${order.message ? `<div class="msg">${escapeHtml(order.message)}</div>` : ""}
    </div>
    <div class="order-actions">
      <button class="toggle-status">${order.status === "done" ? "Позначити новою" : "Позначити оброблено"}</button>
      <button class="danger delete-order">Видалити</button>
    </div>
  `;

  row.querySelector(".toggle-status").addEventListener("click", function () {
    db.collection("orders").doc(id).update({
      status: order.status === "done" ? "new" : "done"
    });
  });

  row.querySelector(".delete-order").addEventListener("click", function () {
    if (confirm("Видалити цю заявку?")) {
      db.collection("orders").doc(id).delete();
    }
  });

  return row;
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
