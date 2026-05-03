// ============================================================
// SISTEMA DE ALMACENAMIENTO - Restaurant App
// Claves únicas para cada módulo (compartidas entre sesiones)
// ============================================================
const STORAGE_KEYS = {
    PLATOS:   'restaurante_platos',    // Módulo 1 - Registro de platos
    PEDIDOS:  'restaurante_pedidos',   // Módulo 2 - Pedidos
    COCINA:   'restaurante_cocina',    // Módulo 3 - Control de cocina
    FACTURAS: 'restaurante_facturas',  // Módulo 4 - Facturación
};

// ------------------------------------------------------------
// Helpers genéricos (úsalos igual en los otros 3 módulos)
// ------------------------------------------------------------
const Storage = {
    get(key) {
        try {
            return JSON.parse(localStorage.getItem(key)) || [];
        } catch {
            return [];
        }
    },
    set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
            return false;
        }
    },
    add(key, item) {
        const lista = this.get(key);
        lista.push(item);
        return this.set(key, lista);
    },
    update(key, id, cambios) {
        const lista = this.get(key);
        const idx = lista.findIndex(item => item.id === id);
        if (idx === -1) return false;
        lista[idx] = { ...lista[idx], ...cambios };
        return this.set(key, lista);
    },
    remove(key, id) {
        const lista = this.get(key);
        return this.set(key, lista.filter(item => item.id !== id));
    },
};

// ============================================================
// MÓDULO 1 - Registro rápido de platos
// ============================================================
document.getElementById('rapidPlatoForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const codigo = document.getElementById('rapidCodigo').value.trim();
    const nombre = document.getElementById('rapidNombre').value.trim();
    const precio = parseFloat(document.getElementById('rapidPrecio').value);

    if (!codigo || !nombre || isNaN(precio) || precio <= 0) {
        alert('Complete todos los campos correctamente');
        return;
    }

    // Evitar códigos duplicados
    const platosExistentes = Storage.get(STORAGE_KEYS.PLATOS);
    const duplicado = platosExistentes.some(p => p.codigo === codigo);
    if (duplicado) {
        alert(`El código "${codigo}" ya está registrado`);
        return;
    }

    const nuevoPlato = {
        id:           Date.now().toString(),
        codigo,
        nombre,
        descripcion:  'Plato registrado rápidamente',
        categoria:    'Otros',
        precio,
        tiempo:       20,
        estado:       'Activo',
        alergenos:    ['Ninguno'],
        otroAlergeno: '',
        modificable:  'Consultar con el chef',
        creadoEn:     new Date().toISOString(),   // útil para Módulo 4
    };

    const guardado = Storage.add(STORAGE_KEYS.PLATOS, nuevoPlato);

    if (guardado) {
        alert('Plato registrado exitosamente');
        window.location.href = 'platos.html';
    } else {
        alert('Error al guardar el plato. Intente nuevamente.');
    }
});

