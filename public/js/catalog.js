// =====================================================================
// Динамічний каталог з Firebase
// =====================================================================

document.addEventListener("DOMContentLoaded", () => {
  const catalogGrid = document.getElementById("catalogGrid");
  const catalogFilter = document.getElementById("catalogFilter");
  
  if (!catalogGrid || !catalogFilter) return; // Працюємо тільки на сторінці каталогу
  
  const db = firebase.firestore();
  let allProducts = [];
  
  // 1. Завантажуємо категорії для фільтра
  db.collection("categories").orderBy("createdAt", "asc").get().then(snapshot => {
    snapshot.forEach(doc => {
      const cat = doc.data();
      const btn = document.createElement("button");
      btn.className = "btn secondary";
      btn.setAttribute("data-category", doc.id);
      btn.textContent = escapeHtml(cat.name);
      
      btn.addEventListener("click", () => {
        document.querySelectorAll("#catalogFilter .btn").forEach(b => {
          b.classList.add("secondary");
          b.classList.remove("active");
        });
        btn.classList.remove("secondary");
        btn.classList.add("active");
        renderProducts(doc.id);
      });
      
      catalogFilter.appendChild(btn);
    });
    
    // Кнопка "Всі товари" (вже в HTML, додаємо логіку)
    const allBtn = catalogFilter.querySelector('[data-category="all"]');
    if (allBtn) {
      allBtn.addEventListener("click", () => {
        document.querySelectorAll("#catalogFilter .btn").forEach(b => {
          b.classList.add("secondary");
          b.classList.remove("active");
        });
        allBtn.classList.remove("secondary");
        allBtn.classList.add("active");
        renderProducts("all");
      });
    }
  });

  // 2. Завантажуємо всі товари
  db.collection("products").orderBy("createdAt", "desc").get().then(snapshot => {
    allProducts = [];
    snapshot.forEach(doc => {
      allProducts.push({ id: doc.id, ...doc.data() });
    });
    renderProducts("all");
  }).catch(error => {
    console.error("Помилка завантаження каталогу:", error);
    catalogGrid.innerHTML = "<p style='grid-column:1/-1; text-align:center;'>Не вдалося завантажити каталог. Спробуйте пізніше.</p>";
  });
  
  // 3. Рендер товарів
  function renderProducts(categoryId) {
    catalogGrid.innerHTML = "";
    
    const filtered = categoryId === "all" 
      ? allProducts 
      : allProducts.filter(p => p.categoryId === categoryId);
      
    if (filtered.length === 0) {
      catalogGrid.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:var(--muted);'>У цій категорії поки немає товарів.</p>";
      return;
    }
    
    filtered.forEach((prod, index) => {
      const div = document.createElement("div");
      div.className = `card reveal d${(index % 4) + 1} visible`; // Одразу visible для динамічних
      div.style.paddingBottom = "22px";
      
      // Безпечні параметри для onClick
      const safeName = prod.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeUrl = prod.imageUrl ? prod.imageUrl.replace(/'/g, "\\'") : '';
      
      div.innerHTML = `
        <div class="thumb" style="background-image:url('${prod.imageUrl}'); background-size:cover; background-position:center; height:220px;">
          ${prod.price ? `<div style="position:absolute; top:10px; right:10px; background:var(--gold); color:var(--dark); font-weight:bold; padding:4px 10px; border-radius:12px; font-size:.85rem;">${prod.price} грн</div>` : ''}
        </div>
        <h3>${escapeHtml(prod.name)}</h3>
        <p>${escapeHtml(prod.desc || "")}</p>
        <button onclick="addToCart('${prod.id}', '${safeName}', ${prod.price || 0}, '${safeUrl}')" class="btn" style="margin:0 20px; width:calc(100% - 40px); justify-content:center;">Додати в кошик</button>
      `;
      catalogGrid.appendChild(div);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
