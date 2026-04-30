const KEY = 'maffia_platos';
const get = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const set = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;

function cargar(){
  const sel = document.getElementById('sel');
  const platos = get();
  sel.innerHTML = platos.map(p =>
    `<option value="${p.codigo}">${p.codigo} - ${p.nombre || '(sin nombre)'}</option>`
  ).join('') || '<option value="">Sin platos</option>';
  sel.onchange = () => {
    const p = get().find(x => x.codigo === sel.value);
    document.getElementById('nombre').value = p?.nombre || '';
  };
  sel.onchange();
}
function guardarNombre(){
  const cod = document.getElementById('sel').value;
  const v = document.getElementById('nombre').value.trim();
  if(!cod) return msg('⚠ Selecciona un código', false);
  if(!v) return msg('⚠ Nombre obligatorio', false);
  if(v.length < 3) return msg('⚠ Mínimo 3 caracteres', false);
  if(v.length > 60) return msg('⚠ Máximo 60 caracteres', false);
  if(/^\d+$/.test(v)) return msg('⚠ No puede ser solo números', false);
  const platos = get();
  platos.find(x => x.codigo === cod).nombre = v;
  set(platos);
  msg('✔ Nombre guardado: ' + v);
  cargar();
}
cargar();
