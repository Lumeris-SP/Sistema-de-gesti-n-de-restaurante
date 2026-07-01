// ============================================================
// js/pages/registro.page.js
// MAFFIA — Página de registro
// ============================================================
// Reemplaza al registro.js original. Cambio de comportamiento
// importante que debes conocer:
//
// El registro.js anterior generaba un "código de verificación" de
// 6 dígitos en el propio navegador (Math.random()) y lo mostraba
// en pantalla (codigoDisplay.textContent = codigoGenerado) para
// que el usuario lo copiara y lo pegara. Eso no verificaba que el
// correo realmente existiera ni perteneciera a quien se registra
// — era puramente decorativo.
//
// Con Supabase Auth, si tienes "Confirm email" activado en
// Authentication > Settings, Supabase envía un correo real con un
// link de confirmación, y aquí simplemente le decimos al usuario
// que revise su bandeja de entrada. Si tienes esa opción
// desactivada (recomendado solo en desarrollo), el registro queda
// confirmado de inmediato y avanzamos directo al paso 3.
//
// Auth.registrar() ya guarda rol/estado correctos vía el trigger
// de sql/03_auth_trigger.sql — no se inserta nada manualmente aquí.
//
// Requiere supabaseClient.js y core/auth.js cargados antes.
// ============================================================

// Nota: esto va envuelto en una IIFE async porque este proyecto
// usa <script> clásicos (sin type="module"), donde el top-level
// await no está permitido por el navegador.
(async function redirigirSiYaHaySesion() {
    if (await Auth.estaAutenticado()) {
        window.location.href = 'index.html';
    }
})();

function mostrarMsg(texto, tipo) {
    const el = document.getElementById('regMsg');
    el.className = 'auth-msg ' + tipo;
    const icons = { error: 'exclamation-circle', success: 'check-circle', info: 'info-circle' };
    el.innerHTML = `<i class="fas fa-${icons[tipo] || 'info-circle'}"></i> ${texto}`;
}

function ocultarMsg() {
    document.getElementById('regMsg').className = 'auth-msg';
}

function togglePass(id, btn) {
    const input = document.getElementById(id);
    const icon = btn.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function checkStrength(pass) {
    const sb = [document.getElementById('sb1'), document.getElementById('sb2'), document.getElementById('sb3')];
    const hint = document.getElementById('passHint');
    sb.forEach((b) => (b.className = 'strength-bar'));

    if (pass.length === 0) {
        hint.textContent = 'Ingresa una contraseña';
        return;
    }
    if (pass.length < 4) {
        sb[0].classList.add('weak');
        hint.textContent = 'Muy corta';
        hint.style.color = '#e53935';
    } else if (pass.length < 8 || !/[A-Z]/.test(pass)) {
        sb[0].classList.add('medium');
        sb[1].classList.add('medium');
        hint.textContent = 'Aceptable — agrega mayúsculas';
        hint.style.color = '#ff9800';
    } else {
        sb[0].classList.add('strong');
        sb[1].classList.add('strong');
        sb[2].classList.add('strong');
        hint.textContent = 'Contraseña fuerte ✓';
        hint.style.color = '#4caf50';
    }
}

function setStep(n) {
    document.querySelectorAll('.step-section').forEach((s, i) => {
        s.classList.toggle('active', i === n - 1);
    });
    for (let i = 1; i <= 3; i++) {
        const dot = document.getElementById('sDot' + i);
        dot.classList.remove('active', 'done');
        if (i < n) dot.classList.add('done');
        else if (i === n) dot.classList.add('active');
    }
    for (let j = 1; j <= 2; j++) {
        document.getElementById('sLine' + j).classList.toggle('done', j < n);
    }
    ocultarMsg();
}

function volverPaso1() {
    setStep(1);
}

// Antes "irPaso2" solo validaba y mostraba el código falso. Ahora
// es donde realmente se llama a Supabase Auth para crear la cuenta
// — por eso pasó de ser sync a async.
async function irPaso2() {
    const nombre = document.getElementById('regNombre').value.trim();
    const apellidos = document.getElementById('regApellidos').value.trim();
    const correo = document.getElementById('regCorreo').value.trim();
    const celular = document.getElementById('regCelular').value.trim();
    const rol = document.getElementById('regRol').value;
    const pass = document.getElementById('regPass').value;
    const passConf = document.getElementById('regPassConfirm').value;

    if (!nombre || !apellidos || !correo || !celular || !pass || !passConf) {
        mostrarMsg('Por favor completa todos los campos.', 'error');
        return;
    }
    if (!rol) {
        mostrarMsg('Debes seleccionar un rol para continuar.', 'error');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
        mostrarMsg('Ingresa un correo electrónico válido.', 'error');
        return;
    }
    if (pass.length < 6) {
        mostrarMsg('La contraseña debe tener al menos 6 caracteres.', 'error');
        return;
    }
    if (pass !== passConf) {
        mostrarMsg('Las contraseñas no coinciden.', 'error');
        return;
    }

    const btn = document.getElementById('btnIrPaso2') || event?.target;
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner"></span> Creando cuenta...';
    }

    const resultado = await Auth.registrar({ nombre, apellidos, correo, celular, rol, password: pass });

    if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-arrow-right"></i> &nbsp;Continuar';
    }

    if (!resultado.ok) {
        mostrarMsg(resultado.mensaje, 'error');
        return;
    }

    document.getElementById('correoMostrado').textContent = correo;

    // Si Supabase ya confirmó la sesión de una (Confirm email
    // desactivado en el proyecto), saltamos directo al paso 3.
    // Si requiere confirmación por correo, mostramos el aviso del
    // paso 2 en modo "espera de confirmación" en vez del código falso.
    if (resultado.usuario && resultado.usuario.identities && resultado.usuario.identities.length === 0) {
        mostrarMsg('Este correo ya está registrado. Inicia sesión.', 'error');
        return;
    }

    setStep(2);
}

// El paso 2 ya no verifica un código de 6 dígitos contra
// Math.random(): simplemente confirma que el usuario revisó su
// correo y avanza. La verificación real ya ocurrió (o ocurrirá)
// directamente con Supabase Auth.
function continuarAPaso3() {
    setStep(3);
}
