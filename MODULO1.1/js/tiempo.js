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
    document.getElementById('tiempo').value = p?.tiempo || '';
  };
  sel.onchange();
}
function guardarTiempo(){
  const cod = document.getElementById('sel').value;
  const v = parseInt(document.getElementById('tiempo').value);
  if(isNaN(v)) return msg('⚠ Tiempo obligatorio', false);
  if(v < 1 || v > 120) return msg('⚠ Debe estar entre 1 y 120 min', false);
  const platos = get();
  platos.find(x => x.codigo === cod).tiempo = v;
  set(platos);
  msg('✔ Tiempo guardado: ' + v + ' min');
}
cargar();
