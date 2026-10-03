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
const tabs=document.getElementById('menuTabs');
const panel=document.getElementById('menuPanel');
function renderMenu(cat){
  [...tabs.children].forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  const group=menu[cat];
  panel.innerHTML=`<div class="menu-category-head"><h3>${cat}</h3><span>${group.items.length} opciones</span></div><div class="menu-items">${group.items.map(([name,price])=>`<div class="menu-item"><strong>${name}</strong><span class="price">$${price}</span></div>`).join('')}</div>${group.note?`<div class="menu-note">${group.note}</div>`:''}`;
}
Object.keys(menu).forEach((cat,i)=>{const b=document.createElement('button');b.className='tab-btn'+(i===0?' active':'');b.dataset.cat=cat;b.type='button';b.setAttribute('role','tab');b.textContent=cat;b.addEventListener('click',()=>renderMenu(cat));tabs.appendChild(b)});renderMenu(Object.keys(menu)[0]);

const header=document.querySelector('.site-header');window.addEventListener('scroll',()=>header.classList.toggle('scrolled',scrollY>30));
const toggle=document.querySelector('.menu-toggle'),drawer=document.querySelector('.mobile-drawer'),closeBtn=document.querySelector('.drawer-close');
function setDrawer(open){drawer.classList.toggle('open',open);drawer.setAttribute('aria-hidden',String(!open));toggle.setAttribute('aria-expanded',String(open));document.body.classList.toggle('drawer-open',open)}
toggle.addEventListener('click',()=>setDrawer(true));closeBtn.addEventListener('click',()=>setDrawer(false));drawer.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setDrawer(false)));

const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>obs.observe(el));

document.getElementById('year').textContent=new Date().getFullYear();
const day=new Date().getDay();const hours={0:'12:00 pm – 4:30 pm',1:'12:00 pm – 9:00 pm',2:'12:00 pm – 9:00 pm',3:'12:00 pm – 9:00 pm',4:'12:00 pm – 9:00 pm',5:'12:00 pm – 10:00 pm',6:'12:00 pm – 10:00 pm'};document.getElementById('todayHours').textContent=hours[day];
