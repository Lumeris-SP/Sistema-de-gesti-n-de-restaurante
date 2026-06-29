// ============================================================
// js/pages/platos.page.js
// MAFFIA — Página de gestión de platos (solo Administrador)
// ============================================================
// Reemplaza a platos.js. La clase GestionPlatos ya no guarda
// nada en localStorage ni valida los datos ella misma: ambas
// cosas viven ahora en PlatosService. Esta clase se dedica solo a
// leer el formulario, mostrar errores, y pintar el listado — el
// mismo rol que tenía antes, pero sin la lógica de negocio mezclada.
//
// Requiere supabaseClient.js, core/auth.js y
// services/platosService.js cargados antes.
// ============================================================

class GestionPlatos {
    constructor() {
        this.platos = [];
        this.editandoId = null;
    }

    async init() {
        const autorizado = await Auth.proteger(['Administrador']);
        if (!autorizado) return;

        await this.cargarPlatos();
        this.registrarEventos();
        this.manejarAlergenos();
    }

    // ─────────────────────────────────────────
    // CARGA Y PERSISTENCIA
    // ─────────────────────────────────────────

    async cargarPlatos() {
        this.platos = await PlatosService.listar();
        this.actualizarListado();
    }

    // ─────────────────────────────────────────
    // EVENTOS
    // ─────────────────────────────────────────

    registrarEventos() {
        document.getElementById('platoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.guardarPlato();
        });

        document.getElementById('cancelarEdicion').addEventListener('click', () => {
            this.cancelarEdicion();
        });

        document.getElementById('buscarInput').addEventListener('input', () => {
            this.filtrarPlatos();
        });

        document.getElementById('filtroEstado').addEventListener('change', () => {
            this.filtrarPlatos();
        });
    }

    manejarAlergenos() {
        const checkboxes = document.querySelectorAll('.alergeno');
        const otroInput = document.getElementById('otroAlergeno');

        checkboxes.forEach((cb) => {
            cb.addEventListener('change', () => {
                if (cb.value === 'Ninguno' && cb.checked) {
                    checkboxes.forEach((c) => {
                        if (c.value !== 'Ninguno') c.checked = false;
                    });
                    otroInput.style.display = 'none';
                }
                if (cb.value === 'Otro' && cb.checked) {
                    otroInput.style.display = 'block';
                } else if (cb.value === 'Otro' && !cb.checked) {
                    otroInput.style.display = 'none';
                    otroInput.value = '';
                }
                if (cb.value !== 'Ninguno' && cb.checked) {
                    const ninguno = document.querySelector('.alergeno[value="Ninguno"]');
                    if (ninguno) ninguno.checked = false;
                }
            });
        });
    }

    // ─────────────────────────────────────────
    // ERRORES (mismo helper visual que antes)
    // ─────────────────────────────────────────

    mostrarErrores(errores) {
        for (const [campo, mensaje] of Object.entries(errores)) {
            const errorSpan = document.getElementById(`${campo}Error`);
            if (errorSpan) errorSpan.textContent = mensaje;
        }
    }

    limpiarErrores() {
        document.querySelectorAll('.error-message').forEach((span) => (span.textContent = ''));
    }

    // ─────────────────────────────────────────
    // CRUD — GUARDAR / EDITAR / ELIMINAR
    // Toda la validación ahora vive en PlatosService; aquí solo
    // se leen los campos del formulario y se muestra el resultado.
    // ─────────────────────────────────────────

    async guardarPlato() {
        const datos = {
            codigo: document.getElementById('codigo').value.trim(),
            nombre: document.getElementById('nombre').value.trim(),
            descripcion: document.getElementById('descripcion').value.trim(),
            categoria: document.getElementById('categoria').value,
            precio: parseFloat(document.getElementById('precio').value),
            tiempoMinutos: parseInt(document.getElementById('tiempo').value, 10),
            estado: document.getElementById('estado').value,
            alergenos: Array.from(document.querySelectorAll('.alergeno:checked')).map((cb) => cb.value),
            otroAlergeno: document.getElementById('otroAlergeno').value.trim(),
            modificable: document.getElementById('modificable').value.trim(),
        };

        this.limpiarErrores();

        const resultado = this.editandoId
            ? await PlatosService.actualizar(this.editandoId, datos)
            : await PlatosService.crear(datos);

        if (!resultado.ok) {
            if (resultado.errores) this.mostrarErrores(resultado.errores);
            else alert(resultado.mensaje || 'No se pudo guardar el plato');
            return;
        }

        if (this.editandoId) {
            alert('Plato actualizado exitosamente');
            this.cancelarEdicion();
        } else {
            alert('Plato registrado exitosamente');
            document.getElementById('platoForm').reset();
        }

        await this.cargarPlatos();
    }

    editarPlato(id) {
        const plato = this.platos.find((p) => p.id === id);
        if (!plato) return;

        this.editandoId = id;

        document.getElementById('codigo').value = plato.codigo;
        document.getElementById('nombre').value = plato.nombre;
        document.getElementById('descripcion').value = plato.descripcion;
        document.getElementById('categoria').value = plato.categoria;
        document.getElementById('precio').value = plato.precio;
        document.getElementById('tiempo').value = plato.tiempoMinutos;
        document.getElementById('estado').value = plato.estado;
        document.getElementById('modificable').value = plato.modificable;

        document.querySelectorAll('.alergeno').forEach((cb) => (cb.checked = false));
        plato.alergenos.forEach((alergeno) => {
            const cb = document.querySelector(`.alergeno[value="${alergeno}"]`);
            if (cb) cb.checked = true;
        });

        if (plato.alergenos.includes('Otro')) {
            document.getElementById('otroAlergeno').style.display = 'block';
            document.getElementById('otroAlergeno').value = plato.otroAlergeno;
        }

        document.getElementById('cancelarEdicion').style.display = 'inline-block';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    cancelarEdicion() {
        this.editandoId = null;
        document.getElementById('platoForm').reset();
        document.getElementById('cancelarEdicion').style.display = 'none';
        this.limpiarErrores();

        document.querySelectorAll('.alergeno').forEach((cb) => (cb.checked = false));
        document.getElementById('otroAlergeno').style.display = 'none';
        document.getElementById('otroAlergeno').value = '';
    }

    async eliminarPlato(id) {
        if (!confirm('¿Está seguro de eliminar este plato?')) return;

        const resultado = await PlatosService.eliminar(id);
        if (!resultado.ok) {
            alert(resultado.mensaje);
            return;
        }
        alert('Plato eliminado exitosamente');
        await this.cargarPlatos();
    }

    async cambiarEstado(id) {
        const plato = this.platos.find((p) => p.id === id);
        if (!plato) return;

        const resultado = await PlatosService.cambiarEstado(id, plato.estado);
        if (!resultado.ok) {
            alert(resultado.mensaje);
            return;
        }
        alert(`Plato ${resultado.nuevoEstado === 'Activo' ? 'activado' : 'desactivado'} exitosamente`);
        await this.cargarPlatos();
    }

    // ─────────────────────────────────────────
    // FILTRADO Y RENDERIZADO (idéntico al original, solo cambia
    // que ahora trabaja sobre this.platos ya cargado en memoria)
    // ─────────────────────────────────────────

    filtrarPlatos() {
        const busqueda = document.getElementById('buscarInput').value.toLowerCase();
        const filtroEstado = document.getElementById('filtroEstado').value;

        let filtrados = this.platos;

        if (busqueda) {
            filtrados = filtrados.filter(
                (p) => p.nombre.toLowerCase().includes(busqueda) || p.categoria.toLowerCase().includes(busqueda)
            );
        }
        if (filtroEstado !== 'todos') {
            filtrados = filtrados.filter((p) => p.estado === filtroEstado);
        }

        this.renderizarListado(filtrados);
    }

    renderizarListado(platos) {
        const container = document.getElementById('platosList');

        if (platos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-utensils"></i>
                    <p>No hay platos registrados</p>
                </div>`;
            return;
        }

        container.innerHTML = platos
            .map(
                (plato) => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <h3>${plato.nombre}</h3>
                        <small>Código: ${plato.codigo} | Categoría: ${plato.categoria}</small>
                    </div>
                    <span class="item-badge ${plato.estado === 'Inactivo' ? 'inactive' : ''}">
                        ${plato.estado === 'Activo' ? '✅ Activo' : '❌ Inactivo'}
                    </span>
                </div>
                <p><strong>Descripción:</strong> ${plato.descripcion}</p>
                <p><strong>Precio:</strong> S/ ${plato.precio.toFixed(2)} | <strong>Tiempo:</strong> ${plato.tiempoMinutos} min</p>
                <p><strong>Alérgenos:</strong> ${plato.alergenos.join(', ')} ${plato.otroAlergeno ? `(${plato.otroAlergeno})` : ''}</p>
                <p><strong>Modificable:</strong> ${plato.modificable}</p>
                <div class="item-actions">
                    <button onclick="gestionPlatos.editarPlato('${plato.id}')" class="btn-secondary">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button onclick="gestionPlatos.cambiarEstado('${plato.id}')" class="btn-primary">
                        <i class="fas fa-sync-alt"></i> Cambiar Estado
                    </button>
                    <button onclick="gestionPlatos.eliminarPlato('${plato.id}')" class="btn-danger">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `
            )
            .join('');
    }

    actualizarListado() {
        this.renderizarListado(this.platos);
    }
}

let gestionPlatos;
document.addEventListener('DOMContentLoaded', async () => {
    gestionPlatos = new GestionPlatos();
    await gestionPlatos.init();
});
