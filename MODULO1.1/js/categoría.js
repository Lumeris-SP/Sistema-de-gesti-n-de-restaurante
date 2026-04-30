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
    document.getElementById('cat').value = p?.categoria || '';
  };
  sel.onchange();
}
function guardarCat(){
  const cod = document.getElementById('sel').value;
  const v = document.getElementById('cat').value;
  if(!v) return msg('⚠ Selecciona una categoría', false);
  const platos = get();
  platos.find(x => x.codigo === cod).categoria = v;
  set(platos);
  msg('✔ Categoría guardada: ' + v);
}
cargar();
