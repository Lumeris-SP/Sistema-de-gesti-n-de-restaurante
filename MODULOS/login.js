if (Auth.estaAutenticado()) {
    window.location.href = 'index.html';
}

function mostrarMsg(id, texto, tipo) {
    var el = document.getElementById(id);
    el.className = 'auth-msg ' + tipo;
    var icono = tipo === 'error' ? 'exclamation-circle' : 'check-circle';
    el.innerHTML = '<i class="fas fa-' + icono + '"></i> ' + texto;
}

function togglePass(inputId, btn) {
    var input = document.getElementById(inputId);
    var icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

function iniciarSesion() {
    var correo = document.getElementById('loginCorreo').value.trim();
    var pass = document.getElementById('loginPass').value;
    var btn = document.getElementById('btnLogin');

    if (!correo || !pass) {
        mostrarMsg('loginMsg', 'Por favor completa todos los campos.', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verificando...';

    setTimeout(function () {
        var usuario = Auth.buscarPorCorreo(correo);

        if (!usuario) {
            mostrarMsg('loginMsg', 'Correo no registrado en el sistema.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> &nbsp;Ingresar';
            return;
        }

        if (usuario.estado === 'Pendiente') {
            mostrarMsg('loginMsg', 'Tu cuenta esta pendiente de verificacion. Espera la aprobacion del administrador.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> &nbsp;Ingresar';
            return;
        }

        if (usuario.estado === 'Inactivo') {
            mostrarMsg('loginMsg', 'Tu cuenta esta desactivada. Contacta al administrador.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> &nbsp;Ingresar';
            return;
        }

        if (btoa(pass) !== usuario.contrasena) {
            mostrarMsg('loginMsg', 'Contrasena incorrecta. Intentalo de nuevo.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> &nbsp;Ingresar';
            return;
        }

        mostrarMsg('loginMsg', 'Bienvenido, ' + usuario.nombre + '! Redirigiendo...', 'success');
        Auth.setSesion(usuario);

        setTimeout(function () {
            window.location.href = 'index.html';
        }, 1000);

    }, 700);
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') iniciarSesion();
});