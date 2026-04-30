const KEY = 'maffia_platos';
const get = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const set = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;

const checks = () => [...document.querySelectorAll('#checks input')];
document.getElementById('otroChk').onchange = e => {
  document.getElementById('otroTxt').disabled = !e.target.checked;
};

function cargar(){
  const sel = document.getElementById('sel');
  sel.innerHTML = get().map(p =>
    `<option value="${p.codigo}">${p.codigo} - ${p.nombre}</option>`
  ).join('');
  sel.onchange = () => {
    const p = get().find(x => x.codigo === sel.value);
    checks().forEach(c => c.checked = p?.alergenos?.includes(c.value));
    document.getElementById('otroTxt').value = p?.otroAlergeno || '';
    document.getElementById('otroTxt').disabled = !document.getElementById('otroChk').checked;
  };
  sel.onchange();
}
function guardarAler(){
  const cod = document.getElementById('sel').value;
  const sel = checks().filter(c => c.checked).map(c => c.value);
  if(sel.length === 0) return msg('⚠ Selecciona al menos uno', false);
  if(sel.includes('Ninguno') && sel.length > 1) return msg('⚠ "Ninguno" no se combina', false);
  const otro = document.getElementById('otroTxt').value.trim();
  if(sel.includes('Otro') && !otro) return msg('⚠ Especifica el alérgeno "Otro"', false);
  const platos = get();
  const p = platos.find(x => x.codigo === cod);
  p.alergenos = sel;
  p.otroAlergeno = otro;
  set(platos);
  msg('✔ Alérgenos guardados');
}
cargar();
