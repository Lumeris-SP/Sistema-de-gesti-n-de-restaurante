const KEY = 'maffia_platos';
const get = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const set = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;
const PROHIBIDAS = ['rico', 'plato', 'bueno', 'rica', 'ok'];

function cargar(){
  const sel = document.getElementById('sel');
  sel.innerHTML = get().map(p =>
    `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
  ).join('');
  sel.onchange = () => {
    const p = get().find(x => x.codigo === sel.value);
    document.getElementById('desc').value = p?.descripcion || '';
  };
  sel.onchange();
}
function guardarDesc(){
  const cod = document.getElementById('sel').value;
  const v = document.getElementById('desc').value.trim();
  if(!v) return msg('⚠ Descripción obligatoria', false);
  if(v.length < 10) return msg('⚠ Mínimo 10 caracteres', false);
  if(v.length > 250) return msg('⚠ Máximo 250 caracteres', false);
  if(PROHIBIDAS.includes(v.toLowerCase())) return msg('⚠ Descripción demasiado vaga', false);
  const platos = get();
  platos.find(x => x.codigo === cod).descripcion = v;
  set(platos);
  msg('✔ Descripción guardada');
}
cargar();
