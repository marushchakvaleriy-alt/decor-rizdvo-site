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

  let cartHtml = "";
  if (order.cart && order.cart.length > 0) {
    const total = order.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    cartHtml = `<div style="margin-top:10px; background:#f9f9f9; padding:10px; border-radius:8px;">
      <strong style="font-size:.85rem; color:var(--dark);">Замовлено:</strong>
      <ul style="margin:4px 0; padding-left:20px; font-size:.85rem;">
        ${order.cart.map(c => `<li>${escapeHtml(c.name)} x${c.qty} (${c.price * c.qty} грн)</li>`).join("")}
      </ul>
      <div style="font-size:.85rem; font-weight:bold; margin-top:4px;">Сума по товарах: ${total} грн</div>
    </div>`;
  }

  row.innerHTML = `
    <div>
      <h4>${escapeHtml(order.name || "Без імені")} <span class="status-pill ${statusClass}">${statusLabel}</span></h4>
      <div class="meta">${escapeHtml(order.phone || "")} · ${escapeHtml(order.interest || "")} · ${date}</div>
      ${order.message ? `<div class="msg">${escapeHtml(order.message)}</div>` : ""}
      ${cartHtml}
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

// =====================================================================
// Вкладки (Tabs)
// =====================================================================
const tabBtns = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    // Зняти активність з усіх
    tabBtns.forEach(b => { b.classList.remove("active"); b.classList.add("secondary"); });
    tabContents.forEach(c => c.style.display = "none");
    
    // Активувати поточну
    btn.classList.add("active");
    btn.classList.remove("secondary");
    const target = document.getElementById(btn.getAttribute("data-target"));
    if (target) {
      target.style.display = "block";
      if (btn.getAttribute("data-target") === "categoriesTab") loadCategories();
      if (btn.getAttribute("data-target") === "productsTab") loadProductsAndCategories();
    }
  });
});

// =====================================================================
// Категорії
// =====================================================================
const categoryForm = document.getElementById("categoryForm");
const categoriesList = document.getElementById("categoriesList");

categoryForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("catName").value.trim();
  if (!name) return;
  
  try {
    await db.collection("categories").add({ name, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    document.getElementById("catName").value = "";
    loadCategories();
  } catch (error) {
    console.error("Помилка створення категорії:", error);
    alert("Помилка створення категорії.");
  }
});

function loadCategories() {
  db.collection("categories").orderBy("createdAt", "asc").get().then(snapshot => {
    categoriesList.innerHTML = "";
    snapshot.forEach(doc => {
      const cat = doc.data();
      const div = document.createElement("div");
      div.className = "order-row";
      div.innerHTML = `
        <div><h4>${escapeHtml(cat.name)}</h4></div>
        <div class="order-actions"><button class="danger" onclick="deleteCategory('${doc.id}')">Видалити</button></div>
      `;
      categoriesList.appendChild(div);
    });
  });
}

window.deleteCategory = async function(id) {
  if (confirm("Видалити цю категорію?")) {
    await db.collection("categories").doc(id).delete();
    loadCategories();
  }
};

// =====================================================================
// Товари
// =====================================================================
const productForm = document.getElementById("productForm");
const productsList = document.getElementById("productsList");
const prodCategorySelect = document.getElementById("prodCategory");
const prodUploadStatus = document.getElementById("prodUploadStatus");
const prodSubmitBtn = document.getElementById("prodSubmitBtn");

function loadProductsAndCategories() {
  // Завантажити категорії для селекту
  db.collection("categories").orderBy("createdAt", "asc").get().then(snapshot => {
    prodCategorySelect.innerHTML = '<option value="">Оберіть категорію...</option>';
    snapshot.forEach(doc => {
      const cat = doc.data();
      prodCategorySelect.innerHTML += `<option value="${doc.id}">${escapeHtml(cat.name)}</option>`;
    });
  });
  
  // Завантажити товари
  loadProducts();
}

productForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const name = document.getElementById("prodName").value.trim();
  const categoryId = prodCategorySelect.value;
  const price = Number(document.getElementById("prodPrice").value);
  const desc = document.getElementById("prodDesc").value.trim();
  
  // Parse Images (comma separated)
  const imageInput = document.getElementById("prodImage").value.trim();
  const images = imageInput.split(",").map(url => url.trim()).filter(url => url.length > 0);
  const imageUrl = images.length > 0 ? images[0] : "";
  
  // Parse Characteristics (newline separated, key: value)
  const charInput = document.getElementById("prodChar").value.trim();
  const characteristics = charInput.split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (!categoryId) { alert("Оберіть категорію!"); return; }
  if (images.length === 0) { alert("Вкажіть посилання на фото!"); return; }
  
  prodSubmitBtn.disabled = true;
  prodUploadStatus.textContent = "Збереження товару...";
  
  try {
    await db.collection("products").add({
      name, categoryId, price, desc, imageUrl, images, characteristics,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    
    // Очистити форму
    productForm.reset();
    prodUploadStatus.textContent = "Товар додано!";
    setTimeout(() => prodUploadStatus.textContent = "", 3000);
    loadProducts();
  } catch (error) {
    console.error("Помилка:", error);
    prodUploadStatus.textContent = "Помилка!";
    prodUploadStatus.style.color = "red";
  } finally {
    prodSubmitBtn.disabled = false;
  }
});

function loadProducts() {
  db.collection("products").orderBy("createdAt", "desc").get().then(snapshot => {
    productsList.innerHTML = "";
    snapshot.forEach(doc => {
      const prod = doc.data();
      const firstImage = (prod.images && prod.images.length > 0) ? prod.images[0] : prod.imageUrl;
      
      const div = document.createElement("div");
      div.className = "card";
      div.style.paddingBottom = "10px";
      div.innerHTML = `
        <div class="thumb" style="background-image:url('${firstImage}'); background-size:cover; background-position:center; height:200px;"></div>
        <div class="card-content" style="padding: 10px 14px;">
          <h3 style="margin:0 0 4px;">${escapeHtml(prod.name)}</h3>
          <p class="price" style="margin:0 0 10px;">${prod.price} грн</p>
          <button class="btn secondary danger" style="margin:0; color:var(--berry); border-color:var(--berry); padding: 8px 12px; font-size:0.85rem;" onclick="deleteProduct('${doc.id}')">Видалити товар</button>
        </div>
      `;
      productsList.appendChild(div);
    });
  });
}

window.deleteProduct = async function(id) {
  if (confirm("Видалити товар назавжди?")) {
    try {
      await db.collection("products").doc(id).delete();
      loadProducts();
    } catch (e) {
      console.error(e);
      alert("Помилка видалення.");
    }
  }
};

