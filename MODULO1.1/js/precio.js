const KEY = 'maffia_platos';
const get = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const set = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;

function cargar(){
  const sel = document.getElementById('sel');
  sel.innerHTML = get().map(p =>
    `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
  ).join('');
  sel.onchange = () => {
    const p = get().find(x => x.codigo === sel.value);
    document.getElementById('precio').value = p?.precio || '';
  };
  sel.onchange();
}
function guardarPrecio(){
  const cod = document.getElementById('sel').value;
  const v = parseFloat(document.getElementById('precio').value);
  if(isNaN(v)) return msg('⚠ Precio numérico obligatorio', false);
  if(v <= 0) return msg('⚠ Debe ser mayor a 0', false);
  if(v > 500) return msg('⚠ Máximo S/ 500.00', false);
  const platos = get();
  platos.find(x => x.codigo === cod).precio = parseFloat(v.toFixed(2));
  set(platos);
  msg('✔ Precio guardado: S/ ' + v.toFixed(2));
}
cargar();
