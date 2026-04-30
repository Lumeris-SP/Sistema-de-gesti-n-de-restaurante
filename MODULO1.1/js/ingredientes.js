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
    document.getElementById('mod').value = p?.modificables || '';
  };
  sel.onchange();
  pintar();
}
function guardarMod(){
  const cod = document.getElementById('sel').value;
  const v = document.getElementById('mod').value.trim();
  if(!v) return msg('⚠ Campo obligatorio', false);
  if(v.length > 200) return msg('⚠ Máximo 200 caracteres', false);
  const platos = get();
  platos.find(x => x.codigo === cod).modificables = v;
  set(platos);
  msg('✔ Guardado');
  pintar();
}
function pintar(){
  const tb = document.querySelector('#tabla tbody');
  tb.innerHTML = get().map(p => `
    <tr>
      <td>${p.codigo}</td>
      <td>${p.nombre || '-'}</td>
      <td>${p.categoria || '-'}</td>
      <td>${(p.precio || 0).toFixed(2)}</td>
      <td>${p.tiempo || '-'}</td>
      <td><span class="badge ${p.estado === 'Activo' ? 'activo' : 'inactivo'}">${p.estado}</span></td>
    </tr>`).join('') || '<tr><td colspan="6">Sin registros</td></tr>';
}
cargar();
