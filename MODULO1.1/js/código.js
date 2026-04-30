const KEY = 'maffia_platos';
const getPlatos = () => JSON.parse(localStorage.getItem(KEY) || '[]');
const setPlatos = p => localStorage.setItem(KEY, JSON.stringify(p));
const msg = (t, ok = true) => document.getElementById('msg').innerHTML =
  `<div class="msg ${ok ? 'ok' : 'err'}">${t}</div>`;

function guardarCodigo(){
  const v = document.getElementById('codigo').value.trim();
  if(!v) return msg('⚠ El código es obligatorio', false);
  if(v.length < 3) return msg('⚠ Mínimo 3 caracteres', false);
  if(/\s/.test(v)) return msg('⚠ No debe contener espacios', false);
  const platos = getPlatos();
  if(platos.find(p => p.codigo === v)) return msg('⚠ Ese código ya existe', false);
  platos.push({
    codigo: v, nombre: '', descripcion: '', categoria: '', precio: 0,
    tiempo: 0, estado: 'Activo', alergenos: [], otroAlergeno: '', modificables: ''
  });
  setPlatos(platos);
  msg('✔ Plato creado con código ' + v);
  document.getElementById('codigo').value = '';
  pintar();
}
function eliminar(c){
  if(!confirm('¿Eliminar ' + c + '?')) return;
  setPlatos(getPlatos().filter(p => p.codigo !== c));
  pintar();
}
function pintar(){
  const tb = document.querySelector('#tabla tbody');
  tb.innerHTML = getPlatos().map(p =>
    `<tr><td>${p.codigo}</td>
     <td><button class="btn danger" onclick="eliminar('${p.codigo}')">Eliminar</button></td></tr>`
  ).join('') || '<tr><td colspan="2">Sin registros</td></tr>';
}
pintar();
