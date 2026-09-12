// =====================================================================
// Динамічний каталог з Firebase (Premium Design)
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
    
    // Кнопка "Всі товари"
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
      catalogGrid.innerHTML = "<p style='grid-column:1/-1; text-align:center; color:var(--muted); font-size:1.1rem;'>У цій категорії поки немає товарів.</p>";
      return;
    }
    
    filtered.forEach((prod, index) => {
      const div = document.createElement("div");
      div.className = `card reveal d${(index % 4) + 1} visible`;
      
      // Images
      let images = prod.images || (prod.imageUrl ? [prod.imageUrl] : []);
      if (images.length === 0) images = ['img/placeholder.jpg'];
      const firstImage = images[0];
      
      const safeName = prod.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      const safeUrl = firstImage.replace(/'/g, "\\'");
      
      // Setup Image HTML (Carousel if > 1)
      let thumbHtml = '';
      if (images.length > 1) {
        const slides = images.map(img => `<img src="${img}" class="carousel-slide" alt="${safeName}">`).join("");
        thumbHtml = `
          <div class="carousel-wrap" data-index="0" data-total="${images.length}">
            <div class="carousel-track">${slides}</div>
            <button class="carousel-btn prev" aria-label="Previous image">‹</button>
            <button class="carousel-btn next" aria-label="Next image">›</button>
          </div>
        `;
      } else {
        thumbHtml = `<img src="${firstImage}" alt="${safeName}" style="width:100%; height:100%; object-fit:cover;">`;
      }
      
      // Characteristics
      let charHtml = '';
      if (prod.characteristics && prod.characteristics.length > 0) {
        charHtml = `<ul class="char-list">` + 
          prod.characteristics.map(c => {
            const parts = c.split(":");
            if (parts.length > 1) {
              return `<li><span>${escapeHtml(parts[0])}</span> <strong>${escapeHtml(parts.slice(1).join(":"))}</strong></li>`;
            }
            return `<li>${escapeHtml(c)}</li>`;
          }).join("") + 
          `</ul>`;
      }
      
      div.innerHTML = `
        <div class="thumb">
          ${thumbHtml}
          ${prod.price ? `<div class="price-badge">${prod.price} грн</div>` : ''}
        </div>
        <div class="card-content">
          <h3>${escapeHtml(prod.name)}</h3>
          <p>${escapeHtml(prod.desc || "")}</p>
          ${charHtml}
          <button onclick="addToCart('${prod.id}', '${safeName}', ${prod.price || 0}, '${safeUrl}')" class="btn">Додати в кошик</button>
        </div>
      `;
      catalogGrid.appendChild(div);
      
      // Add Carousel Logic
      if (images.length > 1) {
        const wrap = div.querySelector('.carousel-wrap');
        const track = div.querySelector('.carousel-track');
        const btnPrev = div.querySelector('.prev');
        const btnNext = div.querySelector('.next');
        let currentIdx = 0;
        
        btnPrev.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIdx = (currentIdx > 0) ? currentIdx - 1 : images.length - 1;
          track.style.transform = \`translateX(-\${currentIdx * 100}%)\`;
        });
        
        btnNext.addEventListener('click', (e) => {
          e.stopPropagation();
          currentIdx = (currentIdx < images.length - 1) ? currentIdx + 1 : 0;
          track.style.transform = \`translateX(-\${currentIdx * 100}%)\`;
        });
      }
    });
  }

  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }
});
