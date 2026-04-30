const KEY = 'maffia_platos';
const get = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const set = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;

function pintar(){
  const tb = document.querySelector('#tabla tbody');
  tb.innerHTML = get().map(p => `
    <tr>
      <td>${p.codigo}</td>
      <td>${p.nombre || '-'}</td>
      <td><span class="badge ${p.estado === 'Activo' ? 'activo' : 'inactivo'}">${p.estado}</span></td>
      <td><button class="btn" onclick="toggle('${p.codigo}')">Cambiar estado</button></td>
    </tr>`).join('') || '<tr><td colspan="4">Sin platos</td></tr>';
}
function toggle(c){
  const platos = get();
  const p = platos.find(x => x.codigo === c);
  p.estado = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
  set(platos);
  msg(`✔ ${c} ahora está ${p.estado}`);
  pintar();
}
pintar();
