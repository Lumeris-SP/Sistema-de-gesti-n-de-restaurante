// ============================================================
// js/pages/login.page.js
// MAFFIA — Página de inicio de sesión
// ============================================================
// Reemplaza al login.js original. La diferencia principal: ya no
// compara contraseñas a mano (antes: btoa(pass) !== usuario.contrasena).
// Toda esa verificación ahora vive en Auth.iniciarSesion(), que
// delega en Supabase Auth.
//
// Requiere, en este orden, antes de este script:
//   <script src=".../supabase-js@2/dist/umd/supabase.js"></script>
//   <script src="../js/core/supabaseClient.js"></script>
//   <script src="../js/core/auth.js"></script>
// ============================================================

(async function redirigirSiYaHaySesion() {
    if (await Auth.estaAutenticado()) {
        window.location.href = 'index.html';
    }
})();

function mostrarMsg(id, texto, tipo) {
    const el = document.getElementById(id);
    el.className = 'auth-msg ' + tipo;
    const icono = tipo === 'error' ? 'exclamation-circle' : 'check-circle';
    el.innerHTML = `<i class="fas fa-${icono}"></i> ${texto}`;
}

function togglePass(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
    } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
    }
}

async function iniciarSesion() {
    const correo = document.getElementById('loginCorreo').value.trim();
    const pass = document.getElementById('loginPass').value;
    const btn = document.getElementById('btnLogin');

    if (!correo || !pass) {
        mostrarMsg('loginMsg', 'Por favor completa todos los campos.', 'error');
        return;
    }

    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verificando...';

    const resultado = await Auth.iniciarSesion(correo, pass);

    if (!resultado.ok) {
        mostrarMsg('loginMsg', resultado.mensaje, 'error');
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> &nbsp;Ingresar';
        return;
    }

    const perfil = await Auth.getPerfil();
    mostrarMsg('loginMsg', `Bienvenido, ${perfil.nombre}! Redirigiendo...`, 'success');

    setTimeout(function () {
        window.location.href = 'index.html';
    }, 1000);
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') iniciarSesion();
});
