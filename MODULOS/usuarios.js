// usuarios.js - Panel de gestión de usuarios (solo Administrador)

if (!Auth.proteger(['Administrador'])) {
    // proteger() ya redirige si no corresponde
}

document.addEventListener('DOMContentLoaded', function () {
    var sesion = Auth.getSesion();
    if (sesion) {
        document.getElementById('sessionText').textContent =
            sesion.nombre + ' ' + (sesion.apellidos || '') + ' — ' + sesion.rol;
    }

    var logoutLink = document.getElementById('navLogout');
    if (logoutLink) {
        logoutLink.addEventListener('click', function (e) {
            e.preventDefault();
            Auth.cerrarSesion();
        });
    }

    renderUsuarios();

    document.getElementById('filtroBusqueda').addEventListener('input', renderUsuarios);
    document.getElementById('filtroEstado').addEventListener('change', renderUsuarios);
    document.getElementById('filtroRol').addEventListener('change', renderUsuarios);
});

function renderUsuarios() {
    var usuarios = Auth.getUsuarios();
    var busqueda = document.getElementById('filtroBusqueda').value.trim().toLowerCase();
    var estadoFiltro = document.getElementById('filtroEstado').value;
    var rolFiltro = document.getElementById('filtroRol').value;

    var filtrados = usuarios.filter(function (u) {
        var nombreCompleto = (u.nombre + ' ' + (u.apellidos || '')).toLowerCase();
        var coincideBusqueda = !busqueda || nombreCompleto.indexOf(busqueda) !== -1 || u.correo.toLowerCase().indexOf(busqueda) !== -1;
        var coincideEstado = !estadoFiltro || u.estado === estadoFiltro;
        var coincideRol = !rolFiltro || u.rol === rolFiltro;
        return coincideBusqueda && coincideEstado && coincideRol;
    });

    document.getElementById('statTotal').textContent = usuarios.length;
    document.getElementById('statPendientes').textContent = usuarios.filter(function (u) { return u.estado === 'Pendiente'; }).length;
    document.getElementById('statActivos').textContent = usuarios.filter(function (u) { return u.estado === 'Activo'; }).length;

    var lista = document.getElementById('listaUsuarios');
    var emptyState = document.getElementById('emptyState');

    if (filtrados.length === 0) {
        lista.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }

    emptyState.style.display = 'none';

    filtrados.sort(function (a, b) {
        if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
        if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
        return new Date(b.fechaRegistro) - new Date(a.fechaRegistro);
    });

    lista.innerHTML = filtrados.map(function (u) {
        var estadoClase = u.estado === 'Pendiente' ? 'pendiente' : (u.estado === 'Activo' ? '' : 'inactivo');
        var inicial = (u.nombre || '?')[0].toUpperCase();
        var fecha = u.fechaRegistro ? new Date(u.fechaRegistro).toLocaleDateString('es-PE') : '—';

        var acciones = '';
        if (u.estado === 'Pendiente') {
            acciones =
                '<button class="btn-success" onclick="activarUsuario(' + u.id + ')"><i class="fas fa-check"></i> Activar</button>' +
                '<button class="btn-danger" onclick="rechazarUsuario(' + u.id + ')"><i class="fas fa-times"></i> Rechazar</button>';
        } else if (u.estado === 'Activo') {
            acciones = '<button class="btn-danger" onclick="desactivarUsuario(' + u.id + ')"><i class="fas fa-ban"></i> Desactivar</button>';
        } else {
            acciones = '<button class="btn-success" onclick="activarUsuario(' + u.id + ')"><i class="fas fa-check"></i> Reactivar</button>';
        }

        return (
            '<div class="item-card">' +
                '<div class="item-header">' +
                    '<div class="user-card-info">' +
                        '<div class="user-card-avatar">' + inicial + '</div>' +
                        '<div class="user-card-text">' +
                            '<h3>' + u.nombre + ' ' + (u.apellidos || '') + '</h3>' +
                            '<p>' + u.correo + '</p>' +
                        '</div>' +
                    '</div>' +
                    '<span class="item-badge ' + estadoClase + '">' + u.estado + '</span>' +
                '</div>' +
                '<div class="user-card-meta">' +
                    '<span class="meta-chip"><i class="fas fa-id-badge"></i> ' + u.rol + '</span>' +
                    '<span class="meta-chip"><i class="fas fa-phone"></i> ' + (u.celular || '—') + '</span>' +
                    '<span class="meta-chip"><i class="fas fa-calendar"></i> ' + fecha + '</span>' +
                '</div>' +
                '<div class="item-actions">' + acciones + '</div>' +
            '</div>'
        );
    }).join('');
}

function activarUsuario(id) {
    var usuarios = Auth.getUsuarios();
    var usuario = usuarios.find(function (u) { return u.id === id; });
    if (!usuario) return;

    usuario.estado = 'Activo';
    Auth.setUsuarios(usuarios);
    renderUsuarios();
}

function desactivarUsuario(id) {
    var usuarios = Auth.getUsuarios();
    var usuario = usuarios.find(function (u) { return u.id === id; });
    if (!usuario) return;

    if (!confirm('¿Desactivar a ' + usuario.nombre + '? No podrá iniciar sesión hasta que lo reactives.')) return;

    usuario.estado = 'Inactivo';
    Auth.setUsuarios(usuarios);
    renderUsuarios();
}

function rechazarUsuario(id) {
    var usuarios = Auth.getUsuarios();
    var usuario = usuarios.find(function (u) { return u.id === id; });
    if (!usuario) return;

    if (!confirm('¿Rechazar y eliminar la solicitud de ' + usuario.nombre + '? Esta acción no se puede deshacer.')) return;

    usuarios = usuarios.filter(function (u) { return u.id !== id; });
    Auth.setUsuarios(usuarios);
    renderUsuarios();
}