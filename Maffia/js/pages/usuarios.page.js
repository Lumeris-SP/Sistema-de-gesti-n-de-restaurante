// ============================================================
// js/pages/usuarios.page.js
// MAFFIA — Panel de administración de usuarios
// ============================================================
// Reemplaza al usuarios.js original. Diferencias clave:
//   - Auth.proteger() ahora es async, y de verdad protege (el
//     usuarios.js original SÍ la llamaba, así que aquí no hay
//     cambio de comportamiento, solo de sintaxis).
//   - Auth.getUsuarios()/setUsuarios() ya no existen: todo pasa
//     por UsuariosService.
//   - rechazarUsuario() ya no borra la cuenta (ver nota en
//     usuariosService.js) — solo cambia su estado a 'Rechazado'.
//
// Requiere supabaseClient.js, core/auth.js y
// services/usuariosService.js cargados antes.
// ============================================================

let _usuariosCache = [];

document.addEventListener('DOMContentLoaded', async () => {
    const autorizado = await Auth.proteger(['Administrador']);
    if (!autorizado) return;

    const perfil = await Auth.getPerfil();
    document.getElementById('sessionText').textContent =
        `${perfil.nombre} ${perfil.apellidos || ''} — ${perfil.rol}`;

    const logoutLink = document.getElementById('navLogout');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            Auth.cerrarSesion();
        });
    }

    await renderUsuarios();

    document.getElementById('filtroBusqueda').addEventListener('input', renderUsuarios);
    document.getElementById('filtroEstado').addEventListener('change', renderUsuarios);
    document.getElementById('filtroRol').addEventListener('change', renderUsuarios);
});

async function renderUsuarios() {
    // Solo se vuelve a consultar la BD si todavía no tenemos los
    // datos en memoria; los filtros (búsqueda/estado/rol) trabajan
    // sobre la misma copia para no golpear Supabase en cada tecla.
    if (_usuariosCache.length === 0) {
        _usuariosCache = await UsuariosService.listar();
    }

    const busqueda = document.getElementById('filtroBusqueda').value.trim().toLowerCase();
    const estadoFiltro = document.getElementById('filtroEstado').value;
    const rolFiltro = document.getElementById('filtroRol').value;

    const filtrados = _usuariosCache.filter((u) => {
        const nombreCompleto = `${u.nombre} ${u.apellidos || ''}`.toLowerCase();
        const coincideBusqueda =
            !busqueda || nombreCompleto.includes(busqueda) || u.correo.toLowerCase().includes(busqueda);
        const coincideEstado = !estadoFiltro || u.estado === estadoFiltro;
        const coincideRol = !rolFiltro || u.rol === rolFiltro;
        return coincideBusqueda && coincideEstado && coincideRol;
    });

    document.getElementById('statTotal').textContent = _usuariosCache.length;
    document.getElementById('statPendientes').textContent = _usuariosCache.filter(
        (u) => u.estado === 'Pendiente'
    ).length;
    document.getElementById('statActivos').textContent = _usuariosCache.filter(
        (u) => u.estado === 'Activo'
    ).length;

    const lista = document.getElementById('listaUsuarios');
    const emptyState = document.getElementById('emptyState');

    if (filtrados.length === 0) {
        lista.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    emptyState.style.display = 'none';

    lista.innerHTML = filtrados
        .map((u) => {
            const estadoClase = u.estado === 'Pendiente' ? 'pendiente' : u.estado === 'Activo' ? '' : 'inactivo';
            const inicial = (u.nombre || '?')[0].toUpperCase();
            const fecha = u.fecha_registro ? new Date(u.fecha_registro).toLocaleDateString('es-PE') : '—';

            let acciones = '';
            if (u.estado === 'Pendiente') {
                acciones = `
                    <button class="btn-success" onclick="activarUsuario('${u.id}')"><i class="fas fa-check"></i> Activar</button>
                    <button class="btn-danger" onclick="rechazarUsuario('${u.id}')"><i class="fas fa-times"></i> Rechazar</button>`;
            } else if (u.estado === 'Activo') {
                acciones = `<button class="btn-danger" onclick="desactivarUsuario('${u.id}')"><i class="fas fa-ban"></i> Desactivar</button>`;
            } else {
                acciones = `<button class="btn-success" onclick="activarUsuario('${u.id}')"><i class="fas fa-check"></i> Reactivar</button>`;
            }

            return `
                <div class="item-card">
                    <div class="item-header">
                        <div class="user-card-info">
                            <div class="user-card-avatar">${inicial}</div>
                            <div class="user-card-text">
                                <h3>${u.nombre} ${u.apellidos || ''}</h3>
                                <p>${u.correo}</p>
                            </div>
                        </div>
                        <span class="item-badge ${estadoClase}">${u.estado}</span>
                    </div>
                    <div class="user-card-meta">
                        <span class="meta-chip"><i class="fas fa-id-badge"></i> ${u.rol}</span>
                        <span class="meta-chip"><i class="fas fa-phone"></i> ${u.celular || '—'}</span>
                        <span class="meta-chip"><i class="fas fa-calendar"></i> ${fecha}</span>
                    </div>
                    <div class="item-actions">${acciones}</div>
                </div>`;
        })
        .join('');
}

async function activarUsuario(id) {
    const resultado = await UsuariosService.activar(id);
    if (!resultado.ok) {
        alert('No se pudo activar: ' + resultado.mensaje);
        return;
    }
    _usuariosCache = []; // invalidar caché para reflejar el cambio
    await renderUsuarios();
}

async function desactivarUsuario(id) {
    const usuario = _usuariosCache.find((u) => u.id === id);
    if (!usuario) return;
    if (!confirm(`¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión hasta que lo reactives.`)) return;

    const resultado = await UsuariosService.desactivar(id);
    if (!resultado.ok) {
        alert('No se pudo desactivar: ' + resultado.mensaje);
        return;
    }
    _usuariosCache = [];
    await renderUsuarios();
}

async function rechazarUsuario(id) {
    const usuario = _usuariosCache.find((u) => u.id === id);
    if (!usuario) return;
    if (!confirm(`¿Rechazar la solicitud de ${usuario.nombre}? Esta acción no se puede deshacer.`)) return;

    const resultado = await UsuariosService.rechazar(id);
    if (!resultado.ok) {
        alert('No se pudo rechazar: ' + resultado.mensaje);
        return;
    }
    _usuariosCache = [];
    await renderUsuarios();
}
