// ============================================================
// js/services/adicionalesService.js
// MAFFIA — Acceso a datos: adicionales
// ============================================================
// Reemplaza la función cargarAdicionalesDB() que vivía dentro de
// pedidos.js, con la URL y la key de Supabase hardcodeadas ahí
// mismo. La tabla `adicionales` ya existía en tu proyecto de
// Supabase; este service solo le da un punto único de acceso,
// igual que a los demás catálogos.
// ============================================================

const AdicionalesService = {
    async listar() {
        const { data, error } = await window.supabaseClient
            .from('adicionales')
            .select('id, nombre, precio')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('[AdicionalesService] Error listando adicionales:', error.message);
            // Mismo fallback que tenía pedidos.js si Supabase no respondía,
            // para que el formulario de pedidos nunca se quede sin opciones.
            return [
                { nombre: 'Porción extra de arroz', precio: 3.0 },
                { nombre: 'Salsa de soya extra', precio: 1.5 },
            ];
        }
        return data;
    },

    async crear(nombre, precio) {
        const { data, error } = await window.supabaseClient
            .from('adicionales')
            .insert({ nombre, precio })
            .select()
            .single();

        if (error) {
            console.error('[AdicionalesService] Error creando adicional:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true, adicional: data };
    },

    async eliminar(id) {
        const { error } = await window.supabaseClient.from('adicionales').delete().eq('id', id);
        if (error) {
            console.error('[AdicionalesService] Error eliminando adicional:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },
};
