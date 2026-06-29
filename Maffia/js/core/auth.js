// ============================================================
// js/core/auth.js
// MAFFIA — Autenticación y control de acceso (Supabase Auth)
// ============================================================
// Reemplaza al auth.js original, que guardaba usuarios y sesión
// en localStorage con contraseñas en btoa() (Base64, no es
// cifrado). Ahora:
//   - Las contraseñas las maneja Supabase Auth (auth.users), con
//     hash real. Este archivo nunca las toca.
//   - El "perfil" de negocio (nombre, rol, estado) vive en la
//     tabla `usuarios`, sincronizada automáticamente por el
//     trigger de sql/03_auth_trigger.sql cuando alguien se
//     registra con Auth.registrar().
//   - La sesión la gestiona supabase-js internamente; aquí solo
//     se expone una forma sencilla de leerla.
//
// La API pública (Auth.estaAutenticado, Auth.getRol,
// Auth.tienePermiso, Auth.proteger...) se mantiene con el MISMO
// nombre y forma que el auth.js anterior a propósito: así, cuando
// migremos cocina.js / cuenta.js / pedidos.js (que hoy ni siquiera
// cargan auth.js — uno de los problemas que detectamos), el cambio
// en cada page.js es mínimo.
//
// Requiere que js/core/supabaseClient.js se haya cargado antes.
// ============================================================

const Auth = {
    ROLES: {
        MOZO: 'Mozo',
        COCINA: 'Cocina',
        CAJA: 'Caja',
        ADMINISTRADOR: 'Administrador',
    },

    PERMISOS: {
        Mozo: ['ver_pedidos', 'cambiar_estado_pedido', 'asignar_mesa', 'ver_menu'],
        Cocina: ['ver_pedidos_cocina', 'marcar_preparado'],
        Caja: ['ver_facturacion', 'generar_factura', 'cerrar_cuenta'],
        Administrador: [
            'gestionar_usuarios', 'gestionar_productos', 'gestionar_pedidos',
            'ver_reportes', 'ver_ventas', 'ver_pedidos', 'cambiar_estado_pedido',
            'asignar_mesa', 'ver_pedidos_cocina', 'marcar_preparado',
            'ver_facturacion', 'generar_factura', 'cerrar_cuenta', 'ver_menu',
        ],
    },

    // Cache en memoria del perfil de negocio (tabla `usuarios`) del
    // usuario actual, para no repetir la consulta a la BD en cada
    // llamada a getRol()/tienePermiso(). Se llena en _cargarPerfil()
    // y se limpia al cerrar sesión.
    _perfilActual: null,

    // ────────────────────────────────────────────────────────
    // SESIÓN
    // ────────────────────────────────────────────────────────

    // Devuelve la sesión de Supabase Auth (o null). A diferencia
    // del auth.js anterior, esto es asíncrono porque supabase-js
    // puede necesitar revisar/refrescar el token.
    async getSesion() {
        const { data, error } = await window.supabaseClient.auth.getSession();
        if (error) {
            console.error('[Auth] Error obteniendo sesión:', error.message);
            return null;
        }
        return data.session;
    },

    async estaAutenticado() {
        const sesion = await this.getSesion();
        return sesion !== null;
    },

    // Carga (o devuelve desde caché) el perfil de negocio del
    // usuario autenticado: nombre, apellidos, rol, estado.
    async _cargarPerfil(forzar = false) {
        if (this._perfilActual && !forzar) return this._perfilActual;

        const sesion = await this.getSesion();
        if (!sesion) {
            this._perfilActual = null;
            return null;
        }

        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('id, nombre, apellidos, correo, celular, rol, estado, fecha_registro')
            .eq('auth_user_id', sesion.user.id)
            .single();

        if (error) {
            console.error('[Auth] Error cargando perfil de usuario:', error.message);
            this._perfilActual = null;
            return null;
        }

        this._perfilActual = data;
        return data;
    },

    async getPerfil() {
        return this._cargarPerfil();
    },

    async getRol() {
        const perfil = await this._cargarPerfil();
        return perfil ? perfil.rol : null;
    },

    async tienePermiso(permiso) {
        const rol = await this.getRol();
        if (!rol) return false;
        const lista = this.PERMISOS[rol] || [];
        return lista.indexOf(permiso) !== -1;
    },

    // ────────────────────────────────────────────────────────
    // LOGIN / REGISTRO / LOGOUT
    // ────────────────────────────────────────────────────────

    // login.js llama a esto en vez de comparar contraseñas a mano.
    // Devuelve { ok: true } o { ok: false, mensaje }.
    async iniciarSesion(correo, password) {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: correo,
            password: password,
        });

        if (error) {
            return { ok: false, mensaje: this._traducirError(error) };
        }

        const perfil = await this._cargarPerfil(true);

        if (perfil && perfil.estado !== 'Activo') {
            // El usuario existe en auth.users pero su perfil de
            // negocio todavía no fue activado por un Administrador
            // (igual que el flujo de usuarios.js: activarUsuario /
            // rechazarUsuario). Cerramos la sesión recién creada
            // para no dejarlo "a medias" autenticado.
            await window.supabaseClient.auth.signOut();
            this._perfilActual = null;
            const mensajes = {
                Pendiente: 'Tu cuenta está pendiente de aprobación por un administrador.',
                Inactivo: 'Tu cuenta está desactivada. Contacta a un administrador.',
                Rechazado: 'Tu solicitud de registro fue rechazada.',
            };
            return { ok: false, mensaje: mensajes[perfil.estado] || 'No puedes iniciar sesión en este momento.' };
        }

        return { ok: true };
    },

    // registro.js llama a esto. datos = { nombre, apellidos, correo,
    // celular, password, rol }. El trigger de la BD
    // (sql/03_auth_trigger.sql) crea automáticamente la fila en
    // `usuarios` a partir de options.data, así que aquí no se hace
    // ningún insert manual.
    async registrar(datos) {
        const { data, error } = await window.supabaseClient.auth.signUp({
            email: datos.correo,
            password: datos.password,
            options: {
                data: {
                    nombre: datos.nombre,
                    apellidos: datos.apellidos,
                    celular: datos.celular,
                    rol: datos.rol || 'Mozo',
                },
            },
        });

        if (error) {
            return { ok: false, mensaje: this._traducirError(error) };
        }

        return { ok: true, usuario: data.user };
    },

    async cerrarSesion() {
        await window.supabaseClient.auth.signOut();
        this._perfilActual = null;
        window.location.href = 'login.html';
    },

    // ────────────────────────────────────────────────────────
    // PROTECCIÓN DE PÁGINAS
    // ────────────────────────────────────────────────────────
    // Uso en cada page.js (incluyendo cocina.js, cuenta.js y
    // pedidos.js, que en el proyecto original NO llamaban a esto):
    //
    //   document.addEventListener('DOMContentLoaded', async () => {
    //       const ok = await Auth.proteger(['Cocina', 'Administrador']);
    //       if (!ok) return; // proteger() ya redirige si falla
    //       // ... resto de la inicialización de la página
    //   });
    async proteger(rolesPermitidos) {
        rolesPermitidos = rolesPermitidos || [];

        const autenticado = await this.estaAutenticado();
        if (!autenticado) {
            window.location.href = 'login.html';
            return false;
        }

        const rol = await this.getRol();

        if (!rol) {
            // Tiene sesión en auth.users pero no hay perfil en
            // `usuarios` (caso raro: trigger falló, o cuenta a medio
            // crear). Tratamos como no autenticado por seguridad.
            await this.cerrarSesion();
            return false;
        }

        if (rolesPermitidos.length > 0 && rolesPermitidos.indexOf(rol) === -1) {
            alert('No tienes permiso para acceder a esta sección.');
            window.location.href = 'index.html';
            return false;
        }

        return true;
    },

    // ────────────────────────────────────────────────────────
    // UTILIDADES
    // ────────────────────────────────────────────────────────

    _traducirError(error) {
        const mapa = {
            'Invalid login credentials': 'Correo o contraseña incorrectos.',
            'User already registered': 'Ya existe una cuenta con ese correo.',
            'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
            'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
            'email rate limit exceeded': 'Se alcanzó el límite de correos de Supabase. Espera unos minutos o pide al administrador configurar SMTP propio.',
        };
        return mapa[error.message] || error.message;
    },
};

// A diferencia del auth.js anterior, NO hay un Auth.inicializarDatos()
// que crea usuarios de prueba en localStorage: los usuarios reales
// ahora se crean con Auth.registrar() y viven en Supabase. Si
// necesitas un usuario Administrador inicial para probar el sistema,
// créalo registrándote normalmente y luego cambia su `estado` y `rol`
// directamente desde el SQL Editor de Supabase (una sola vez):
//
//   update usuarios set rol = 'Administrador', estado = 'Activo'
//   where correo = 'tu-correo@ejemplo.com';
