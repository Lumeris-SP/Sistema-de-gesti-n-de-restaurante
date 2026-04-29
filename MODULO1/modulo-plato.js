// modulo-plato.js - Registro rápido
document.getElementById('rapidPlatoForm').addEventListener('submit', (e) => {
    e.preventDefault();
    
    const nuevoPlato = {
        id: Date.now().toString(),
        codigo: document.getElementById('rapidCodigo').value.trim(),
        nombre: document.getElementById('rapidNombre').value.trim(),
        descripcion: 'Plato registrado rápidamente',
        categoria: 'Otros',
        precio: parseFloat(document.getElementById('rapidPrecio').value),
        tiempo: 20,
        estado: 'Activo',
        alergenos: ['Ninguno'],
        otroAlergeno: '',
        modificable: 'Consultar con el chef'
    };
    
    if (!nuevoPlato.codigo || !nuevoPlato.nombre || !nuevoPlato.precio) {
        alert('Complete todos los campos');
        return;
    }
    
    const platos = JSON.parse(localStorage.getItem('platos')) || [];
    platos.push(nuevoPlato);
    localStorage.setItem('platos', JSON.stringify(platos));
    
    alert('Plato registrado exitosamente');
    window.location.href = 'platos.html';
});