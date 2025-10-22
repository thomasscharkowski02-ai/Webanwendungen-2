/* ==========================================================================
   Restaurant Lecker – Zentrales Skript
   ========================================================================== */
const CONFIG = {
  currency: "€",
  texts: {
    daily: {
      0: "Heute haben wir Ruhetag. Wir freuen uns auf morgen!",
      1: "Pizza Margherita mit frischem Basilikum (8,90 €)",
      2: "Pizza Funghi mit Champignons und Kräutern (9,90 €)",
      3: "Pizza BBQ Chicken mit Zwiebeln (11,90 €)",
      4: "Pizza Verdure – buntes Gemüse (10,90 €)",
      5: "Pizza Diavolo – scharf und würzig (11,50 €)",
      6: "Trüffel-Pizza mit Rucola (12,90 €)"
    }
  },
  prices: {
    size: { "26": 6.5, "30": 8.5, "36": 10.5 },
    dough: { american: 0.5, italian: 0, glutenfree: 1.0 },
    sauce: { tomato: 0, white: 0.5, bbq: 0.5, oilherbs: 0.3 },
    cheese: { mozzarella: 0, cheddar: 0.5, goat: 1.0 },
    toppings: {
      salami: 1.2, ham: 1.0, parma: 1.5, chicken: 1.4,
      porcini: 1.2, paprika: 0.8, onion: 0.5, olives: 0.9,
      rucola: 0.7, peperoni: 0.7, corn: 0.6, mushrooms: 0.8
    },
    shippingFlat: 0
  },
  storageKey: "lecker_v3_cart"
};

function euro(n){ return n.toFixed(2).replace(".", ",") + " " + CONFIG.currency; }
function checkedValues(selector){ return Array.from(document.querySelectorAll(selector + ":checked")).map(el => el.value); }
function loadCart(){ try { return JSON.parse(localStorage.getItem(CONFIG.storageKey) || "[]"); } catch { return []; } }
function saveCart(items){ localStorage.setItem(CONFIG.storageKey, JSON.stringify(items)); }
function pizzaLabel(item){
  const cheeseTxt = item.cheeses?.length ? " • Käse: " + item.cheeses.join(", ") : "";
  const topsTxt = item.toppings?.length ? " • Beläge: " + item.toppings.join(", ") : "";
  const noteTxt = item.note ? ` • Hinweis: ${item.note}` : "";
  return `Pizza (${item.size}cm, ${item.dough}, ${item.sauce}${cheeseTxt}${topsTxt}${noteTxt})`;
}

document.addEventListener("DOMContentLoaded", () => {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const dailyEl = document.getElementById("daily-special");
  if (dailyEl){
    const today = new Date().getDay();
    dailyEl.textContent = CONFIG.texts.daily[today];
  }

  const priceEl = document.getElementById("price");
  const sizeEl = document.getElementById("size");
  const doughEl = document.getElementById("dough");
  const sauceEl = document.getElementById("sauce");
  const qtyEl = document.getElementById("qty");
  const noteEl = document.getElementById("note");
  const addBtn = document.getElementById("add-to-cart");

  const miniList = document.getElementById("mini-cart-list");
  const miniEmpty = document.getElementById("mini-cart-empty");
  const miniSummary = document.getElementById("mini-cart-summary");
  const miniTotal = document.getElementById("mini-cart-total");

  if (priceEl && sizeEl && doughEl && sauceEl && qtyEl && addBtn){
    function calcUnit(){
      let unit = 0;
      unit += CONFIG.prices.size[sizeEl.value] || 0;
      unit += CONFIG.prices.dough[doughEl.value] || 0;
      unit += CONFIG.prices.sauce[sauceEl.value] || 0;
      checkedValues("input.cheese").forEach(c => unit += CONFIG.prices.cheese[c] || 0);
      checkedValues("input.topping").forEach(t => unit += CONFIG.prices.toppings[t] || 0);
      return unit;
    }
    function calcAndRenderPrice(){
      const qty = Math.max(1, parseInt(qtyEl.value || "1", 10));
      const total = calcUnit() * qty;
      priceEl.textContent = euro(total);
      return total;
    }
    ["change","input"].forEach(ev => {
      document.body.addEventListener(ev, (e) => {
        if (e.target.closest("main")) calcAndRenderPrice();
      }, true);
    });
    calcAndRenderPrice();

    addBtn.addEventListener("click", () => {
      const item = {
        size: sizeEl.value,
        dough: doughEl.options[doughEl.selectedIndex].text,
        sauce: sauceEl.options[sauceEl.selectedIndex].text,
        cheeses: checkedValues("input.cheese").map(v => ({mozzarella:"Mozzarella", cheddar:"Cheddar", goat:"Ziegenkäse"}[v] || v)),
        toppings: checkedValues("input.topping").map(v => ({
          salami:"Salami", ham:"Hinterschinken", parma:"Parmaschinken", chicken:"Hähnchen",
          porcini:"Steinpilze", paprika:"Paprika", onion:"Zwiebeln", olives:"Oliven",
          rucola:"Rucola", peperoni:"Peperoni", corn:"Mais", mushrooms:"Champignons"
        }[v] || v)),
        note: (noteEl?.value || "").trim(),
        qty: Math.max(1, parseInt(qtyEl.value || "1", 10))
      };
      const unit = calcUnit();
      item.unit = unit;
      item.total = unit * item.qty;

      const cart = loadCart();
      cart.push(item);
      saveCart(cart);

      renderMiniCart();
      calcAndRenderPrice();
      alert("Pizza zum Warenkorb hinzugefügt.");
    });

    function renderMiniCart(){
      if (!miniList || !miniEmpty || !miniSummary || !miniTotal) return;
      const cart = loadCart();
      miniList.innerHTML = "";
      if (cart.length === 0){
        miniEmpty.style.display = "block";
        miniSummary.style.display = "none";
        return;
      }
      miniEmpty.style.display = "none";
      miniSummary.style.display = "flex";
      let sum = 0;
      cart.forEach(it => {
        sum += it.total;
        const li = document.createElement("li");
        li.innerHTML = `<span class="small">${pizzaLabel(it)}</span><strong>${euro(it.total)}</strong>`;
        miniList.appendChild(li);
      });
      miniTotal.textContent = euro(sum);
    }
    renderMiniCart();
  }

  const cartTable = document.getElementById("cart-table");
  const cartBody = document.getElementById("cart-body");
  const cartEmpty = document.getElementById("cart-empty");
  const cartSubtotal = document.getElementById("cart-subtotal");
  const cartShipping = document.getElementById("cart-shipping");
  const cartTotal = document.getElementById("cart-total");

  if (cartTable && cartBody && cartEmpty && cartSubtotal && cartTotal){
    function renderCart(){
      const items = loadCart();
      cartBody.innerHTML = "";
      if (items.length === 0){
        cartEmpty.style.display = "block";
        cartTable.style.display = "none";
      } else {
        cartEmpty.style.display = "none";
        cartTable.style.display = "table";
      }
      let sum = 0;
      items.forEach((it, idx) => {
        sum += it.total;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>
            <div><strong>${pizzaLabel(it)}</strong></div>
            <div class="small">Einzelpreis: ${euro(it.unit)}</div>
          </td>
          <td><input type="number" class="cart-qty" data-idx="${idx}" min="1" value="${it.qty}" /></td>
          <td>${euro(it.total)}</td>
          <td><button class="btn-secondary remove" data-idx="${idx}">Entfernen</button></td>
        `;
        cartBody.appendChild(tr);
      });
      cartSubtotal.textContent = euro(sum);
      const shipping = CONFIG.prices.shippingFlat || 0;
      if (cartShipping) cartShipping.textContent = euro(shipping);
      cartTotal.textContent = euro(sum + shipping);

      cartBody.querySelectorAll(".cart-qty").forEach(inp => {
        inp.addEventListener("change", (e) => {
          const idx = +e.target.dataset.idx;
          const qty = Math.max(1, parseInt(e.target.value || "1", 10));
          const items = loadCart();
          const it = items[idx];
          if (!it) return;
          it.qty = qty;
          it.total = it.unit * qty;
          saveCart(items);
          renderCart();
        });
      });
      cartBody.querySelectorAll(".remove").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = +e.target.dataset.idx;
          const items = loadCart();
          items.splice(idx, 1);
          saveCart(items);
          renderCart();
        });
      });
    }
    renderCart();
  }

  const coList = document.getElementById("checkout-list");
  const coTotal = document.getElementById("checkout-total");
  const coForm = document.getElementById("checkout-form");
  const coConfirm = document.getElementById("order-confirmation");

  if (coList && coTotal){
    const items = loadCart();
    let sum = 0;
    coList.innerHTML = "";
    items.forEach(it => {
      sum += it.total;
      const li = document.createElement("li");
      li.innerHTML = `<span class="small">${pizzaLabel(it)}</span><strong>${euro(it.total)}</strong>`;
      coList.appendChild(li);
    });
    coTotal.textContent = euro(sum);
  }

  if (coForm && coConfirm){
    coForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saveCart([]);
      coForm.closest(".grid-2").style.display = "none";
      coConfirm.style.display = "block";
    });
  }
});
