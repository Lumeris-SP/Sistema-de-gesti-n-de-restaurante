// ============================================================
// js/services/usuariosService.js
// MAFFIA — Acceso a datos: usuarios (panel de Administrador)
// ============================================================
// Reemplaza Auth.getUsuarios()/setUsuarios() y las funciones
// activarUsuario/desactivarUsuario/rechazarUsuario que vivían
// sueltas en usuarios.js. La diferencia importante frente al
// original: "rechazar" ya no puede borrar la fila de `usuarios`
// sin más, porque esa fila está enlazada a una cuenta real en
// auth.users (Supabase Auth). Por eso rechazar() aquí solo cambia
// el estado a 'Rechazado' — el usuario simplemente no podrá volver
// a iniciar sesión (Auth.iniciarSesion ya bloquea ese estado).
//
// Si además quieres eliminar por completo la cuenta de auth.users
// al rechazar, eso requiere la Service Role Key (nunca debe vivir
// en el frontend) y se hace mejor con una Edge Function de
// Supabase — lo dejamos fuera del alcance de este service.
// ============================================================

const UsuariosService = {
    async listar() {
        const { data, error } = await window.supabaseClient
            .from('usuarios')
            .select('id, nombre, apellidos, correo, celular, rol, estado, fecha_registro')
            .order('fecha_registro', { ascending: false });

        if (error) {
            console.error('[UsuariosService] Error listando usuarios:', error.message);
            return [];
        }

        // Mismo orden que renderUsuarios() original: pendientes primero.
        return data.sort((a, b) => {
            if (a.estado === 'Pendiente' && b.estado !== 'Pendiente') return -1;
            if (a.estado !== 'Pendiente' && b.estado === 'Pendiente') return 1;
            return new Date(b.fecha_registro) - new Date(a.fecha_registro);
        });
    },

    async activar(id) {
        const { error } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'Activo' })
            .eq('id', id);

        if (error) {
            console.error('[UsuariosService] Error activando usuario:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },

    async desactivar(id) {
        const { error } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'Inactivo' })
            .eq('id', id);

        if (error) {
            console.error('[UsuariosService] Error desactivando usuario:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },

    // Antes esto eliminaba la fila por completo. Ahora solo cambia
    // el estado (ver nota arriba sobre por qué no se puede borrar
    // limpiamente desde el frontend).
    async rechazar(id) {
        const { error } = await window.supabaseClient
            .from('usuarios')
            .update({ estado: 'Rechazado' })
            .eq('id', id);

        if (error) {
            console.error('[UsuariosService] Error rechazando usuario:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },
};
