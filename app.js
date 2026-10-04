const WHATSAPP_NUMBER = '584249372501';
const CART_KEY = 'jaiAlaiCartV1';

const menu = {
  'Entradas': {
    items:[
      ['Aguacate con camarones',28],['Chistorras',15],['Coctel de camarones',25],['Croquetas de Jamón Serrano',15],['Ensalada completa',12],['Ensalada de aguacate y palmito',12],['Tortilla española',12],['Tortilla con chistorras',18],['Carpaccio de Lau Lau',20]
    ]
  },
  'Sopas':{items:[['Consomé de mariscos',10],['Sopa de mariscos',15]]},
  'Hamburguesas':{items:[['Hamburguesa de carne',15],['Hamburguesa de lomito',15],['Hamburguesa de pollo a la plancha',15],['Hamburguesa de pollo crispy',15]],note:'Acompañadas con papas fritas.'},
  'Carnes y aves':{items:[['Picada de lomito',22],['Medallones de lomito',22],['Churrasco de lomito',22],['Milanesa de lomito',22],['Brocheta de lomito',22],['Lomo de Cochino',22],['Parrilla Mixta',22],['Brocheta mixta',22],['Pollo a la plancha',22],['Picada de pollo',22],['Milanesa de pollo',22],['Brocheta de pollo',22],['Nuggets de pollo',22],['Callos a la Vizcaína',20]],note:'Todos los platos incluyen 2 contornos.'},
  'Pescados y mariscos':{items:[['Parrilla de mariscos',28],['Pulpo',30],['Calamares (rebozados, a la plancha)',28],['Camarones (ajillo, empanizado, enchilados, a la plancha)',28],['Cazuela de mariscos',32],['Churrasco de Lau Lau',22],['Brocheta de Lau Lau',22],['Pescado de mar del día',27]]},
  'Especiales':{items:[['Mar y Tierra para 1',30],['Mar y Tierra para 2',56],['Paella para 2',56],['Arroz a la marinera para 2',56],['Asopado de mariscos para 2',56],['Pasta a la marinera',25]]},
  'Raciones / contornos':{items:[['Papas fritas',7],['Puré de papas',7],['Papas al vapor',5],['Vegetales',8],['Tajada',4],['Arroz',4],['Ensalada de aguacate y palmito',12],['Ensalada completa',12],['Salsa tártara',5]],note:'Los platos indicados en el menú incluyen 2 contornos cuando aplica.'}
};

const tabs = document.getElementById('menuTabs');
const panel = document.getElementById('menuPanel');
const cartDrawer = document.getElementById('cartDrawer');
const cartBackdrop = document.getElementById('cartBackdrop');
const cartItemsEl = document.getElementById('cartItems');
const cartTotalEl = document.getElementById('cartTotal');
const cartCountEls = document.querySelectorAll('[data-cart-count]');
const toast = document.getElementById('cartToast');
const orderForm = document.getElementById('orderForm');
const orderType = document.getElementById('orderType');
const deliveryFields = document.getElementById('deliveryFields');

let cart = loadCart();

function money(value){
  return `$${Number(value).toFixed(2)}`;
}

function slug(value){
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
}

function loadCart(){
  try {
    const data = JSON.parse(localStorage.getItem(CART_KEY));
    return Array.isArray(data) ? data : [];
  } catch (_) {
    return [];
  }
}

function saveCart(){
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  renderCart();
}

function addToCart(name, price, category){
  const key = `${category}::${name}`;
  const found = cart.find(item => item.key === key);
  if(found){
    found.qty += 1;
  } else {
    cart.push({key, name, price:Number(price), category, qty:1});
  }
  saveCart();
  showToast(`${name} agregado al pedido`);
}

function updateQty(key, delta){
  const item = cart.find(row => row.key === key);
  if(!item) return;
  item.qty += delta;
  if(item.qty <= 0) cart = cart.filter(row => row.key !== key);
  saveCart();
}

function removeItem(key){
  cart = cart.filter(row => row.key !== key);
  saveCart();
}

function cartCount(){
  return cart.reduce((sum, item) => sum + item.qty, 0);
}

function cartTotal(){
  return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
}

function renderMenu(cat){
  [...tabs.children].forEach(b => {
    const active = b.dataset.cat === cat;
    b.classList.toggle('active', active);
    b.setAttribute('aria-selected', String(active));
  });
  const group = menu[cat];
  panel.innerHTML = `
    <div class="menu-category-head">
      <h3>${cat}</h3><span>${group.items.length} opciones</span>
    </div>
    <div class="menu-items">
      ${group.items.map(([name,price]) => `
        <article class="menu-item">
          <div class="menu-item-copy"><strong>${name}</strong><span class="menu-item-category">${cat}</span></div>
          <div class="menu-item-actions">
            <span class="price">${money(price)}</span>
            <button class="add-to-cart" type="button" data-name="${encodeURIComponent(name)}" data-price="${price}" data-category="${encodeURIComponent(cat)}" aria-label="Agregar ${name} al pedido">+ Agregar</button>
          </div>
        </article>`).join('')}
    </div>
    ${group.note ? `<div class="menu-note">${group.note}</div>` : ''}`;

  panel.querySelectorAll('.add-to-cart').forEach(button => {
    button.addEventListener('click', () => addToCart(
      decodeURIComponent(button.dataset.name),
      Number(button.dataset.price),
      decodeURIComponent(button.dataset.category)
    ));
  });
}

Object.keys(menu).forEach((cat, i) => {
  const b = document.createElement('button');
  b.className = 'tab-btn' + (i === 0 ? ' active' : '');
  b.dataset.cat = cat;
  b.type = 'button';
  b.setAttribute('role','tab');
  b.setAttribute('aria-selected', String(i === 0));
  b.textContent = cat;
  b.addEventListener('click', () => renderMenu(cat));
  tabs.appendChild(b);
});
renderMenu(Object.keys(menu)[0]);

function renderCart(){
  const count = cartCount();
  cartCountEls.forEach(el => el.textContent = count);
  document.body.classList.toggle('has-cart-items', count > 0);

  if(!count){
    cartItemsEl.innerHTML = `
      <div class="cart-empty">
        <span class="cart-empty-icon">✦</span>
        <h3>Tu pedido está vacío.</h3>
        <p>Agrega tus platos favoritos desde el menú y aquí calculamos el total.</p>
        <button type="button" class="btn btn-gold" data-close-cart>Explorar menú</button>
      </div>`;
    cartTotalEl.textContent = money(0);
    cartItemsEl.querySelector('[data-close-cart]').addEventListener('click', () => {
      closeCart();
      document.getElementById('menu').scrollIntoView({behavior:'smooth'});
    });
    return;
  }

  cartItemsEl.innerHTML = cart.map(item => `
    <article class="cart-item">
      <div class="cart-item-main">
        <span>${item.category}</span>
        <strong>${item.name}</strong>
        <small>${money(item.price)} c/u</small>
      </div>
      <div class="cart-item-controls">
        <div class="qty-control" aria-label="Cantidad de ${item.name}">
          <button type="button" data-dec="${encodeURIComponent(item.key)}" aria-label="Restar uno">−</button>
          <b>${item.qty}</b>
          <button type="button" data-inc="${encodeURIComponent(item.key)}" aria-label="Sumar uno">+</button>
        </div>
        <strong>${money(item.price * item.qty)}</strong>
        <button class="remove-item" type="button" data-remove="${encodeURIComponent(item.key)}" aria-label="Eliminar ${item.name}">Eliminar</button>
      </div>
    </article>`).join('');

  cartItemsEl.querySelectorAll('[data-dec]').forEach(btn => btn.addEventListener('click', () => updateQty(decodeURIComponent(btn.dataset.dec), -1)));
  cartItemsEl.querySelectorAll('[data-inc]').forEach(btn => btn.addEventListener('click', () => updateQty(decodeURIComponent(btn.dataset.inc), 1)));
  cartItemsEl.querySelectorAll('[data-remove]').forEach(btn => btn.addEventListener('click', () => removeItem(decodeURIComponent(btn.dataset.remove))));
  cartTotalEl.textContent = money(cartTotal());
}

function openCart(){
  cartDrawer.classList.add('open');
  cartBackdrop.classList.add('open');
  cartDrawer.setAttribute('aria-hidden','false');
  document.body.classList.add('cart-open');
  setTimeout(() => document.getElementById('cartClose').focus(), 80);
}

function closeCart(){
  cartDrawer.classList.remove('open');
  cartBackdrop.classList.remove('open');
  cartDrawer.setAttribute('aria-hidden','true');
  document.body.classList.remove('cart-open');
}

document.querySelectorAll('[data-open-cart]').forEach(btn => btn.addEventListener('click', openCart));
document.getElementById('cartClose').addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

document.addEventListener('keydown', event => {
  if(event.key === 'Escape'){
    closeCart();
    setDrawer(false);
    closeHighlightLightbox();
  }
});

function showToast(message){
  toast.querySelector('span').textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove('show'), 2300);
}

function orderCode(){
  const now = new Date();
  const d = String(now.getDate()).padStart(2,'0');
  const m = String(now.getMonth()+1).padStart(2,'0');
  const h = String(now.getHours()).padStart(2,'0');
  const min = String(now.getMinutes()).padStart(2,'0');
  return `JA-${d}${m}-${h}${min}`;
}

function buildWhatsAppMessage(data){
  const code = orderCode();
  const lines = cart.map(item => `• ${item.qty} × ${item.name} — ${money(item.price * item.qty)}`);
  const typeLabel = data.type === 'delivery' ? 'Delivery' : 'Retiro en el local';
  const addressLine = data.type === 'delivery' && data.address ? `\n📍 Dirección: ${data.address}` : '';
  const notesLine = data.notes ? `\n📝 Observaciones: ${data.notes}` : '';
  return `Hola Jai Alai 👋\n\nQuiero confirmar este pedido *${code}*:\n\n${lines.join('\n')}\n\n*TOTAL: ${money(cartTotal())}*\n\n👤 Cliente: ${data.name}\n📱 Teléfono: ${data.phone}\n🛍️ Modalidad: ${typeLabel}${addressLine}${notesLine}\n\nEntiendo que el pago se coordina directamente por WhatsApp con Jai Alai. ¿Me confirman disponibilidad y forma de pago, por favor?`;
}

orderType.addEventListener('change', () => {
  const isDelivery = orderType.value === 'delivery';
  deliveryFields.hidden = !isDelivery;
  document.getElementById('customerAddress').required = isDelivery;
});

orderForm.addEventListener('submit', event => {
  event.preventDefault();
  if(!cart.length){
    showToast('Agrega al menos un plato antes de generar el pedido');
    closeCart();
    document.getElementById('menu').scrollIntoView({behavior:'smooth'});
    return;
  }
  if(!orderForm.reportValidity()) return;

  const data = {
    name: document.getElementById('customerName').value.trim(),
    phone: document.getElementById('customerPhone').value.trim(),
    type: orderType.value,
    address: document.getElementById('customerAddress').value.trim(),
    notes: document.getElementById('customerNotes').value.trim()
  };
  const message = buildWhatsAppMessage(data);
  const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  showToast('Pedido generado. Solo falta enviarlo en WhatsApp');
});

document.getElementById('clearCart').addEventListener('click', () => {
  if(!cart.length) return;
  if(confirm('¿Vaciar todo el pedido?')){
    cart = [];
    saveCart();
  }
});

// Highlight / lightbox
const highlightLightbox = document.getElementById('highlightLightbox');
const highlightLightboxImg = highlightLightbox.querySelector('img');
const highlightLightboxCaption = highlightLightbox.querySelector('p');

document.querySelectorAll('.highlight-card').forEach(card => {
  card.addEventListener('click', () => {
    const img = card.querySelector('img');
    highlightLightboxImg.src = img.src;
    highlightLightboxImg.alt = img.alt;
    highlightLightboxCaption.textContent = card.dataset.caption || '#highlight Jai Alai';
    highlightLightbox.classList.add('open');
    highlightLightbox.setAttribute('aria-hidden','false');
    document.body.classList.add('lightbox-open');
  });
});

function closeHighlightLightbox(){
  highlightLightbox.classList.remove('open');
  highlightLightbox.setAttribute('aria-hidden','true');
  document.body.classList.remove('lightbox-open');
}

document.getElementById('highlightClose').addEventListener('click', closeHighlightLightbox);
highlightLightbox.addEventListener('click', event => {
  if(event.target === highlightLightbox) closeHighlightLightbox();
});

// Header, mobile drawer and reveal effects
const header = document.querySelector('.site-header');
window.addEventListener('scroll', () => header.classList.toggle('scrolled', scrollY > 30));
const toggle = document.querySelector('.menu-toggle');
const drawer = document.querySelector('.mobile-drawer');
const closeBtn = document.querySelector('.drawer-close');
function setDrawer(open){
  drawer.classList.toggle('open',open);
  drawer.setAttribute('aria-hidden',String(!open));
  toggle.setAttribute('aria-expanded',String(open));
  document.body.classList.toggle('drawer-open',open);
}
toggle.addEventListener('click', () => setDrawer(true));
closeBtn.addEventListener('click', () => setDrawer(false));
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setDrawer(false)));

const obs = new IntersectionObserver(entries => entries.forEach(entry => {
  if(entry.isIntersecting) entry.target.classList.add('visible');
}), {threshold:.12});
document.querySelectorAll('.reveal').forEach(el => obs.observe(el));

document.getElementById('year').textContent = new Date().getFullYear();
const day = new Date().getDay();
const hours = {0:'12:00 pm – 4:30 pm',1:'12:00 pm – 9:00 pm',2:'12:00 pm – 9:00 pm',3:'12:00 pm – 9:00 pm',4:'12:00 pm – 9:00 pm',5:'12:00 pm – 10:00 pm',6:'12:00 pm – 10:00 pm'};
document.getElementById('todayHours').textContent = hours[day];

renderCart();
