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
        <div style="display:flex; align-items:center; gap:10px; margin-bottom:15px; border-bottom:1px solid #eee; padding-bottom:15px;">
          <div style="width:60px; height:60px; background-image:url('${item.imageUrl}'); background-size:cover; background-position:center; border-radius:8px;"></div>
          <div style="flex-grow:1;">
            <h4 style="margin:0 0 4px; font-size:1rem;">${item.name}</h4>
            <div style="color:var(--dark); font-weight:bold;">${item.price} грн</div>
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <button onclick="changeQty('${item.id}', -1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #ddd; background:#fff; cursor:pointer;">-</button>
            <span style="font-weight:bold; width:20px; text-align:center;">${item.qty}</span>
            <button onclick="changeQty('${item.id}', 1)" style="width:28px; height:28px; border-radius:50%; border:1px solid #ddd; background:#fff; cursor:pointer;">+</button>
          </div>
          <button onclick="removeFromCart('${item.id}')" style="background:none; border:none; color:var(--berry); cursor:pointer; font-size:1.2rem;" title="Видалити">×</button>
        </div>
      `).join("");
    }
  }
}

// Модалка кошика
document.addEventListener("DOMContentLoaded", () => {
  updateCartUI(); // Ініціалізація при завантаженні
  
  const cartBtn = document.getElementById("cartBtn");
  const cartModal = document.getElementById("cartModal");
  const closeCartBtn = document.getElementById("closeCartBtn");
  
  if (cartBtn && cartModal) {
    cartBtn.addEventListener("click", (e) => {
      e.preventDefault();
      cartModal.style.display = "flex";
    });
    
    closeCartBtn.addEventListener("click", () => {
      cartModal.style.display = "none";
    });
    
    cartModal.addEventListener("click", (e) => {
      if (e.target === cartModal) cartModal.style.display = "none";
    });
  }
});
