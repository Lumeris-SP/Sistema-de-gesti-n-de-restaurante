if (Auth.estaAutenticado()) {
    window.location.href = 'index.html';
}

let codigoGenerado = null;

function mostrarMsg(texto, tipo) {
    var el = document.getElementById('regMsg');
    el.className = 'auth-msg ' + tipo;
    var icons = { error: 'exclamation-circle', success: 'check-circle', info: 'info-circle' };
    el.innerHTML = '<i class="fas fa-' + (icons[tipo] || 'info-circle') + '"></i> ' + texto;
}

function ocultarMsg() {
    document.getElementById('regMsg').className = 'auth-msg';
}

function togglePass(id, btn) {
    var input = document.getElementById(id);
    var icon = btn.querySelector('i');
    input.type = input.type === 'password' ? 'text' : 'password';
    icon.className = input.type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
}

function checkStrength(pass) {
    var sb = [document.getElementById('sb1'), document.getElementById('sb2'), document.getElementById('sb3')];
    var hint = document.getElementById('passHint');
    sb.forEach(function (b) { b.className = 'strength-bar'; });

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
    document.querySelectorAll('.step-section').forEach(function (s, i) {
        s.classList.toggle('active', i === n - 1);
    });
    for (var i = 1; i <= 3; i++) {
        var dot = document.getElementById('sDot' + i);
        dot.classList.remove('active', 'done');
        if (i < n) dot.classList.add('done');
        else if (i === n) dot.classList.add('active');
    }
    for (var j = 1; j <= 2; j++) {
        var line = document.getElementById('sLine' + j);
        line.classList.toggle('done', j < n);
    }
    ocultarMsg();
}

function volverPaso1() {
    setStep(1);
}

function irPaso2() {
    var nombre    = document.getElementById('regNombre').value.trim();
    var apellidos = document.getElementById('regApellidos').value.trim();
    var correo    = document.getElementById('regCorreo').value.trim();
    var celular   = document.getElementById('regCelular').value.trim();
    var rol       = document.getElementById('regRol').value;
    var pass      = document.getElementById('regPass').value;
    var passConf  = document.getElementById('regPassConfirm').value;

    if (!nombre || !apellidos || !correo || !celular || !pass || !passConf) {
        mostrarMsg('Por favor completa todos los campos.', 'error');
        return;
    }

    if (!rol) {
        mostrarMsg('Debes seleccionar un rol para continuar.', 'error');
        return;
    }

    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    if (Auth.buscarPorCorreo(correo)) {
        mostrarMsg('Este correo ya está registrado. <a href="login.html" style="color:#c9a227">Inicia sesión</a>', 'error');
        return;
    }

    window._regTemp = { nombre: nombre, apellidos: apellidos, correo: correo, celular: celular, rol: rol, pass: pass };

    codigoGenerado = String(Math.floor(100000 + Math.random() * 900000));

    document.getElementById('correoMostrado').textContent = correo;
    document.getElementById('codigoDisplay').textContent = codigoGenerado;

    document.querySelectorAll('.code-digit').forEach(function (d) {
        d.value = '';
        d.classList.remove('filled');
    });

    setStep(2);

    setTimeout(function () {
        document.querySelector('.code-digit').focus();
    }, 200);
}

document.addEventListener('DOMContentLoaded', function () {
    var digits = document.querySelectorAll('.code-digit');
    digits.forEach(function (input, idx) {
        input.addEventListener('input', function () {
            input.value = input.value.replace(/[^0-9]/g, '');
            if (input.value) {
                input.classList.add('filled');
                if (idx < digits.length - 1) digits[idx + 1].focus();
            } else {
                input.classList.remove('filled');
            }
        });
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && !input.value && idx > 0) {
                digits[idx - 1].focus();
            }
        });
    });
});

function verificarCodigo() {
    var digits = document.querySelectorAll('.code-digit');
    var ingresado = Array.from(digits).map(function (d) { return d.value; }).join('');

    if (ingresado.length < 6) {
        mostrarMsg('Ingresa los 6 dígitos del código.', 'error');
        return;
    }

    var btn = document.getElementById('btnVerificar');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Verificando...';

    setTimeout(function () {
        if (ingresado !== codigoGenerado) {
            mostrarMsg('Código incorrecto. Inténtalo de nuevo.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fas fa-check-circle"></i> &nbsp;Verificar Código';
            document.querySelectorAll('.code-digit').forEach(function (d) {
                d.value = '';
                d.classList.remove('filled');
            });
            document.querySelector('.code-digit').focus();
            return;
        }

        var datos = window._regTemp;
        var usuarios = Auth.getUsuarios();
        var nuevoId = usuarios.length > 0 ? Math.max.apply(null, usuarios.map(function (u) { return u.id; })) + 1 : 1;

        usuarios.push({
            id: nuevoId,
            nombre: datos.nombre,
            apellidos: datos.apellidos,
            correo: datos.correo,
            celular: datos.celular,
            contrasena: btoa(datos.pass),
            rol: datos.rol,
            estado: 'Pendiente',
            fechaRegistro: new Date().toISOString()
        });

        Auth.setUsuarios(usuarios);
        window._regTemp = null;
        codigoGenerado = null;

        setStep(3);

    }, 800);
}

function reenviarCodigo() {
    codigoGenerado = String(Math.floor(100000 + Math.random() * 900000));
    document.getElementById('codigoDisplay').textContent = codigoGenerado;
    document.querySelectorAll('.code-digit').forEach(function (d) {
        d.value = '';
        d.classList.remove('filled');
    });
    document.querySelector('.code-digit').focus();
    mostrarMsg('Código reenviado correctamente.', 'info');
}