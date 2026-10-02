/* ============ 1. EDIT THIS PART: cafe settings ============ */
const CONFIG = {
  phone: "0592130131",
  currency: "GH₵",
  prepMinutes: 20,        // preparation time for ASAP orders
  openTime: "08:00",      // placeholder opening time - change to your real hours
  closeTime: "20:00",     // placeholder closing time - change to your real hours
  bulkNoticeHours: 48,    // minimum notice for bulk orders
  testButton: true        // shows a "Test: next stage" button on the tracker. Set to false when the admin side is ready
};

/* ============ 2. EDIT THIS PART: menu ============
   price: null means "price not set yet" (customers can't add it).
   Replace null with a number, e.g. price: 25
   image: put a photo link or file name later, e.g. image: "images/latte.jpg" */
const MENU = [
  { cat: "Bites", icon: "🥪", items: [
    { id: "b1", name: "Pancake", price: 20, emoji: "🥞", desc: "Fresh pancakes.", image: "" },
    { id: "b2", name: "French Toast", price: 30, emoji: "🍞", desc: "Golden French toast.", image: "" },
    { id: "b3", name: "Bread & Egg", price: 20, emoji: "🍳", desc: "Bread with egg.", image: "" },
    { id: "b4", name: "Chicken Sandwich", price: 35, emoji: "🥪", desc: "Sandwich with chicken.", image: "" },
    { id: "b5", name: "Beef Sandwich", price: 35, emoji: "🥪", desc: "Sandwich with beef.", image: "" },
    { id: "b6", name: "Chicken & Beef Sandwich", price: 45, emoji: "🥪", desc: "Chicken and beef together.", image: "" },
    { id: "b7", name: "Chicken Shawarma", price: 40, emoji: "🌯", desc: "Wrapped with chicken.", image: "" },
    { id: "b8", name: "Beef Shawarma", price: 40, emoji: "🌯", desc: "Wrapped with beef.", image: "" },
    { id: "b9", name: "Beef & Chicken Shawarma", price: 45, emoji: "🌯", desc: "Beef and chicken together.", image: "" }
  ]},
  { cat: "Coffee", icon: "☕", items: [
    { id: "c1", name: "Brown Sugar Cinnamon Latte", price: null, emoji: "☕", desc: "Latte with brown sugar and cinnamon.", image: "" },
    { id: "c2", name: "Caramel Latte", price: null, emoji: "☕", desc: "Latte with caramel.", image: "" },
    { id: "c3", name: "Vanilla Latte", price: null, emoji: "☕", desc: "Latte with vanilla.", image: "" },
    { id: "c4", name: "Honey Latte", price: null, emoji: "🍯", desc: "Latte with honey.", image: "" },
    { id: "c5", name: "Brown Sugar Latte", price: null, emoji: "☕", desc: "Latte with brown sugar.", image: "" }
  ]},
  { cat: "Cold & Refreshing", icon: "🧊", items: [
    { id: "r1", name: "Classic Ice Kenkey", price: 30, emoji: "🧊", desc: "Cold and refreshing.", image: "" },
    { id: "r2", name: "Mango Ice Kenkey", price: 40, emoji: "🥭", desc: "Ice kenkey with mango.", image: "" },
    { id: "r3", name: "Dragon Fruit Ice Kenkey", price: 40, emoji: "🐉", desc: "Ice kenkey with dragon fruit.", image: "" },
    { id: "r4", name: "Trina Plain", price: 40, emoji: "🥛", desc: "Plain Trina.", image: "" },
    { id: "r5", name: "Trina Choco", price: 40, emoji: "🍫", desc: "Chocolate Trina.", image: "" }
  ]},
  { cat: "Soft Drinks", icon: "🥤", items: [
    { id: "s1", name: "Coca-Cola", price: null, emoji: "🥤", desc: "Chilled soft drink.", image: "" },
    { id: "s2", name: "Fanta", price: null, emoji: "🥤", desc: "Chilled soft drink.", image: "" },
    { id: "s3", name: "Sprite", price: null, emoji: "🥤", desc: "Chilled soft drink.", image: "" },
    { id: "s4", name: "Pepsi", price: null, emoji: "🥤", desc: "Chilled soft drink.", image: "" }
  ]},
  { cat: "Water", icon: "💧", items: [
    { id: "w1", name: "Bottled Water", price: null, emoji: "💧", desc: "Chilled bottled water.", image: "" }
  ]}
];

const STAGES = ["Order Received", "Preparing", "Packaging", "Order Ready"];

/* ============ 3. Helpers (no need to edit) ============ */
const $ = s => document.querySelector(s);
const money = n => CONFIG.currency + n;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const load = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) ?? d; } catch { return d; } };
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const mins = t => { const [h, m] = t.split(":"); return +h * 60 + +m; };
const fmtT = d => d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
const fmtD = d => d.toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });
const ITEMS = {};
MENU.forEach(c => c.items.forEach(i => ITEMS[i.id] = i));
let cart = load("oreaCart", {});

/* ============ 4. Backend connection points ============
   Later, replace these 3 functions with calls to a real database.
   Everything else on the page can stay the same. */
function saveOrder(order) { const all = load("oreaOrders", []); all.push(order); save("oreaOrders", all); save("oreaCurrent", order.id); }
function getCurrentOrder() { return load("oreaOrders", []).find(o => o.id === load("oreaCurrent", "")); }
function saveBulk(req) { const all = load("oreaBulk", []); all.push(req); save("oreaBulk", all); }

/* ============ 5. Screens ============ */
const VIEWS = ["menu", "cart", "checkout", "bulk", "done"];
function go(v) {
  VIEWS.forEach(x => $("#" + x + "View").classList.toggle("hidden", x !== v));
  window.scrollTo(0, 0);
  if (v === "cart") renderCart();
  if (v === "checkout") setupCheckout();
  if (v === "bulk") setupBulk();
  if (v === "done") renderDone();
}

/* ============ 6. Menu ============ */
function renderMenu() {
  $("#tabs").innerHTML = MENU.map((c, i) => `<a href="#cat${i}" class="c${i}">${c.icon} ${c.cat}</a>`).join("");
  $("#menu").innerHTML = MENU.map((c, i) =>
    `<h2 id="cat${i}">${c.icon} ${c.cat}</h2><div class="grid">${c.items.map(card).join("")}</div>`).join("");
}
function stepper(id) {
  return `<div class="step"><button data-act="dec" data-id="${id}">−</button><b>${cart[id]}</b><button data-act="inc" data-id="${id}">+</button></div>`;
}
function card(i) {
  const price = i.price == null ? `<span class="price tba">Price coming soon</span>` : `<span class="price">${money(i.price)}</span>`;
  const btn = i.price == null ? `<button class="add" disabled>Add +</button>`
    : cart[i.id] ? stepper(i.id) : `<button class="add" data-act="inc" data-id="${i.id}">Add +</button>`;
  const pic = i.image ? `<img src="${i.image}" alt="${esc(i.name)}">` : i.emoji;
  return `<div class="card"><div class="pic">${pic}</div><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p><div class="row">${price}${btn}</div></div>`;
}

/* ============ 7. Cart ============ */
const total = () => Object.entries(cart).reduce((s, [id, q]) => s + ITEMS[id].price * q, 0);
function change(id, d) {
  cart[id] = (cart[id] || 0) + d;
  if (cart[id] <= 0) delete cart[id];
  save("oreaCart", cart);
  refresh();
}
function refresh() {
  $("#cartCount").textContent = Object.values(cart).reduce((a, b) => a + b, 0);
  renderMenu();
  if (!$("#cartView").classList.contains("hidden")) renderCart();
}
function renderCart() {
  const ids = Object.keys(cart);
  if (!ids.length) {
    $("#cartView").innerHTML = `<h2>🛒 Your cart</h2><p class="note">Your cart is empty. Let's fix that!</p><button class="primary" data-go="menu">Browse the menu</button>`;
    return;
  }
  $("#cartView").innerHTML = `<h2>🛒 Your cart</h2>` + ids.map(id => {
    const i = ITEMS[id];
    return `<div class="line"><div><b>${esc(i.name)}</b><small>${money(i.price)} each</small><small>Subtotal: ${money(i.price * cart[id])}</small></div>
      <div style="display:flex;gap:8px;align-items:center">${stepper(id)}<button class="rm" data-act="rm" data-id="${id}" aria-label="Remove">🗑️</button></div></div>`;
  }).join("") + `<div class="total"><span>Total</span><span>${money(total())}</span></div>
    <div class="btns"><button class="primary" data-go="checkout">Checkout</button>
    <button class="ghost" data-go="menu">Continue shopping</button>
    <button class="ghost" data-act="clear">Clear cart</button></div>`;
}

/* ============ 8. Checkout ============ */
const mode = () => document.querySelector('[name=mode]:checked').value;
const when = () => document.querySelector('[name=when]:checked').value;
function asapStatus() {
  const now = new Date(), ready = new Date(now.getTime() + CONFIG.prepMinutes * 60000);
  const nm = now.getHours() * 60 + now.getMinutes(), rm = ready.getHours() * 60 + ready.getMinutes();
  const ok = nm >= mins(CONFIG.openTime) && rm <= mins(CONFIG.closeTime) && ready.getDate() === now.getDate();
  return { ok, ready };
}
function setupCheckout() {
  const today = new Date().toISOString().slice(0, 10);
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  $("#pDate").min = d.toISOString().slice(0, 10);
  if (!$("#pDate").value) $("#pDate").value = d.toISOString().slice(0, 10);
  $("#hoursNote").textContent = `Open ${CONFIG.openTime} to ${CONFIG.closeTime}. Orders need about ${CONFIG.prepMinutes} minutes to prepare.`;
  updateCheckout();
  $("#coError").textContent = "";
}
function updateCheckout() {
  const del = mode() === "delivery";
  $("#pickupBox").classList.toggle("hidden", del);
  $("#deliveryBox").classList.toggle("hidden", !del);
  $("#laterBox").classList.toggle("hidden", when() !== "later");
  $("#address").required = del;
  const s = asapStatus();
  $("#asapNote").textContent = s.ok ? `Ready in about ${CONFIG.prepMinutes} minutes (around ${fmtT(s.ready)}).`
    : "We can't take ASAP orders right now (outside opening hours). Please schedule for later.";
  $("#coSummary").innerHTML = Object.keys(cart).map(id => `<div class="row"><span>${cart[id]} × ${esc(ITEMS[id].name)}</span><span>${money(ITEMS[id].price * cart[id])}</span></div>`).join("")
    + `<div class="total"><span>Total</span><span>${money(total())}</span></div>`;
}
function placeOrder(e) {
  e.preventDefault();
  const err = m => { $("#coError").textContent = m; };
  const del = mode() === "delivery";
  let pickupLabel = "";
  if (del) {
    if (!$("#agree").checked) return err("Please tick the box to confirm you will arrange your own rider.");
  } else if (when() === "asap") {
    const s = asapStatus();
    if (!s.ok) return err("ASAP isn't available right now. Please schedule for later.");
    pickupLabel = `ASAP (around ${fmtT(s.ready)})`;
  } else {
    const dt = new Date(`${$("#pDate").value}T${$("#pTime").value}`);
    if (isNaN(dt)) return err("Please choose a pickup date and time.");
    const earliest = new Date(Date.now() + CONFIG.prepMinutes * 60000);
    if (dt < earliest) return err(`That time is too soon or already passed. Earliest today: ${fmtT(earliest)}.`);
    const tm = dt.getHours() * 60 + dt.getMinutes();
    if (tm < mins(CONFIG.openTime) || tm > mins(CONFIG.closeTime)) return err(`Pickup time must be between ${CONFIG.openTime} and ${CONFIG.closeTime}.`);
    pickupLabel = `${fmtD(dt)} at ${fmtT(dt)}`;
  }
  const n = load("oreaCounter", 1000) + 1; save("oreaCounter", n);
  saveOrder({
    id: "OC-" + n, createdAt: new Date().toISOString(), status: 0,
    name: $("#name").value.trim(), phone: $("#phone").value.trim(),
    mode: mode(), pickupLabel,
    address: $("#address").value.trim(), landmark: $("#landmark").value.trim(), deliveryInfo: $("#dInfo").value.trim(),
    notes: $("#notes").value.trim(),
    items: Object.keys(cart).map(id => ({ name: ITEMS[id].name, qty: cart[id], price: ITEMS[id].price })),
    total: total()
  });
  cart = {}; save("oreaCart", cart);
  e.target.reset();
  refresh();
  go("done");
}

/* ============ 9. Bulk & event orders ============ */
function setupBulk() {
  const d = new Date(Date.now() + CONFIG.bulkNoticeHours * 3600000);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  $("#bDate").min = d.toISOString().slice(0, 10);
  $("#bulkMsg").textContent = "";
}
function sendBulk(e) {
  e.preventDefault();
  const dt = new Date(`${$("#bDate").value}T${$("#bTime").value}`);
  const msg = $("#bulkMsg");
  msg.className = "error";
  if (isNaN(dt) || dt - Date.now() < CONFIG.bulkNoticeHours * 3600000) {
    msg.textContent = "Bulk orders require 48–72 hours advance notice. Please select a suitable date or contact Oréa Cafe for assistance: " + CONFIG.phone;
    return;
  }
  saveBulk({
    createdAt: new Date().toISOString(), name: $("#bName").value, phone: $("#bPhone").value, eventType: $("#bType").value,
    date: $("#bDate").value, time: $("#bTime").value, people: $("#bPeople").value, items: $("#bItems").value, notes: $("#bNotes").value
  });
  e.target.reset();
  msg.className = "error ok";
  msg.textContent = "Request received! 🎉 Oréa Cafe will confirm with you. Questions? Call " + CONFIG.phone;
}

/* ============ 10. Confirmation + tracking ============ */
function renderDone() {
  const o = getCurrentOrder();
  if (!o) return go("menu");
  const del = o.mode === "delivery";
  const ready = o.status === STAGES.length - 1;
  const readyMsg = del ? "Your order is ready for collection. Please arrange your rider to collect it from Oréa Cafe."
    : "Your order is ready for pickup. Please come and collect your order.";
  $("#doneView").innerHTML = `<h2>Order received! 🎉</h2>
    <div class="card-done"><b>Order ${esc(o.id)}</b><br>${esc(o.name)} · ${esc(o.phone)}
      <div style="margin:10px 0">${o.items.map(i => `<div class="row"><span>${i.qty} × ${esc(i.name)}</span><span>${money(i.qty * i.price)}</span></div>`).join("")}</div>
      <div class="total"><span>Total</span><span>${money(o.total)}</span></div>
      <p>${del ? "🛵 Delivery (you arrange the rider)" : "🛍️ Pick up: " + esc(o.pickupLabel)}</p>
      ${del ? `<p>📍 ${esc(o.address)}${o.landmark ? " · " + esc(o.landmark) : ""}${o.deliveryInfo ? "<br>" + esc(o.deliveryInfo) : ""}</p>` : ""}
      ${o.notes ? `<p>📝 ${esc(o.notes)}</p>` : ""}</div>
    <div class="card-done"><h3>Track your order</h3><ul class="track">
      ${STAGES.map((s, i) => `<li class="${i < o.status ? "done" : i === o.status ? "active" : ""}">${s}</li>`).join("")}</ul>
      ${ready ? `<div class="ready">${readyMsg}</div>` : ""}
      ${CONFIG.testButton && !ready ? `<button class="ghost" data-act="test" style="margin-top:12px">Test: next stage</button>` : ""}
      <p class="note">Questions? Call ${CONFIG.phone}</p></div>
    <button class="primary" data-go="menu">Back to menu</button>`;
}

/* ============ 11. Wire everything up ============ */
document.addEventListener("click", e => {
  const g = e.target.closest("[data-go]");
  if (g) return go(g.dataset.go);
  const b = e.target.closest("[data-act]");
  if (!b) return;
  const a = b.dataset.act, id = b.dataset.id;
  if (a === "inc") change(id, 1);
  if (a === "dec") change(id, -1);
  if (a === "rm") change(id, -cart[id]);
  if (a === "clear" && confirm("Clear your whole cart?")) { cart = {}; save("oreaCart", cart); refresh(); }
  if (a === "test") {
    const all = load("oreaOrders", []), o = all.find(x => x.id === load("oreaCurrent", ""));
    if (o && o.status < STAGES.length - 1) { o.status++; save("oreaOrders", all); renderDone(); }
  }
});
$("#checkoutForm").addEventListener("change", updateCheckout);
$("#checkoutForm").addEventListener("submit", placeOrder);
$("#bulkForm").addEventListener("submit", sendBulk);
setInterval(() => { if (!$("#doneView").classList.contains("hidden")) renderDone(); }, 5000); // picks up status changes

renderMenu();
refresh();
if (getCurrentOrder()) $("#trackBtn").classList.remove("hidden");
new MutationObserver(() => { if (getCurrentOrder()) $("#trackBtn").classList.remove("hidden"); })
  .observe($("#doneView"), { childList: true });
setTimeout(() => $("#splash").classList.add("gone"), 1600);
