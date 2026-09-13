// =====================================================================
// Логіка кошика (збереження в localStorage)
// =====================================================================

let cart = JSON.parse(localStorage.getItem("decor_cart")) || [];

// Збереження і оновлення інтерфейсу
function saveCart() {
  localStorage.setItem("decor_cart", JSON.stringify(cart));
  updateCartUI();
}

// Додавання в кошик
window.addToCart = function(id, name, price, imageUrl) {
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id, name, price, imageUrl, qty: 1 });
  }
  saveCart();
  
  // Анімація кнопки кошика
  const cartCount = document.getElementById("cartCount");
  if (cartCount) {
    cartCount.style.transform = "scale(1.5)";
    setTimeout(() => cartCount.style.transform = "scale(1)", 200);
  }
};

// Видалення
window.removeFromCart = function(id) {
  cart = cart.filter(item => item.id !== id);
  saveCart();
};

// Зміна кількості
window.changeQty = function(id, delta) {
  const item = cart.find(i => i.id === id);
  if (item) {
    item.qty += delta;
    if (item.qty <= 0) window.removeFromCart(id);
    else saveCart();
  }
};

// Оновлення UI
function updateCartUI() {
  const cartCount = document.getElementById("cartCount");
  const cartItemsList = document.getElementById("cartItemsList");
  const cartTotal = document.getElementById("cartTotal");
  
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  if (cartCount) cartCount.textContent = totalItems;
  if (cartTotal) cartTotal.textContent = totalPrice;
  
  if (cartItemsList) {
    if (cart.length === 0) {
      cartItemsList.innerHTML = "<p style='color:var(--muted); text-align:center;'>Кошик порожній</p>";
    } else {
      cartItemsList.innerHTML = cart.map(item => `
        <div class="cart-item">
          <img src="${item.imageUrl}" class="cart-item-img" alt="${item.name}">
          <div class="cart-item-info">
            <h4>${item.name}</h4>
            <div class="price">${item.price} грн</div>
            <div class="cart-qty-ctrl">
              <button onclick="changeQty('${item.id}', -1)" class="qty-btn">-</button>
              <span>${item.qty}</span>
              <button onclick="changeQty('${item.id}', 1)" class="qty-btn">+</button>
            </div>
          </div>
          <button onclick="removeFromCart('${item.id}')" class="remove-btn" title="Видалити">&times;</button>
        </div>
      `).join("");
    }
  }
}

// Модалка кошика (Sidebar)
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI(); // Ініціалізація при завантаженні
  
  const cartBtn = document.getElementById("cartBtn");
  const cartOverlay = document.getElementById("cartOverlay");
  const closeCartBtn = document.getElementById("closeCartBtn");
  
  if (cartBtn && cartOverlay) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cartOverlay.classList.add("active");
    });
    
    if (closeCartBtn) {
      closeCartBtn.addEventListener("click", () => {
        cartOverlay.classList.remove("active");
      });
    }
    
    cartOverlay.addEventListener("click", (e) => {
      if (e.target === cartOverlay) cartOverlay.classList.remove("active");
    });
  }
});
