// ============================================================
// js/services/pedidosService.js
// MAFFIA — Acceso a datos: pedidos
// ============================================================
// Reemplaza la lectura/escritura de localStorage.getItem('pedidos')
// que hacían pedidos.js, cocina.js y cuenta.js cada uno a su
// manera (lo cual generaba el problema que viste documentado en
// pedidoFacturable(): tres formas distintas de escribir el mismo
// estado). Ahora todos pasan por aquí.
//
// Requiere supabaseClient.js cargado antes.
// ============================================================

const PedidosService = {
    // ────────────────────────────────────────────────────────
    // LECTURA
    // ────────────────────────────────────────────────────────

    // Pedidos "vivos" para el tablero de cocina y para pedidos.js:
    // todo lo que no esté pagado ni cancelado.
    async listarActivos() {
        const { data, error } = await window.supabaseClient
            .from('pedidos')
            .select(`
                id, codigo, mesa, mozo, cliente, estado, estado_cocina,
                prioridad, justificacion_urgente, observacion_general,
                total, creado_en,
                pedido_items (
                    id, plato_id, nombre_snapshot, precio_unitario,
                    cantidad, subtotal, estado_plato, tiempo_estimado_min,
                    pedido_item_adicionales ( texto, extra )
                )
            `)
            .not('estado', 'in', '(pagado,cancelado)')
            .order('codigo', { ascending: true });

        if (error) {
            console.error('[PedidosService] Error listando pedidos activos:', error.message);
            return [];
        }
        return data.map(this._aplanar);
    },

    // Pedidos de una mesa específica que ya están listos para
    // facturar (cuenta.js, paso "buscar mesa"). Reemplaza
    // pedidoFacturable() + el filtro a mano que hacía cuenta.js.
    async listarFacturablesPorMesa(mesa) {
        const { data, error } = await window.supabaseClient
            .from('pedidos')
            .select(`
                id, codigo, mesa, mozo, cliente, estado, estado_cocina,
                prioridad, observacion_general, total, creado_en,
                pedido_items (
                    id, plato_id, nombre_snapshot, precio_unitario,
                    cantidad, subtotal, estado_plato,
                    pedido_item_adicionales ( texto, extra )
                ),
                factura_pedidos ( factura_id )
            `)
            .eq('mesa', mesa)
            .in('estado', ['listo', 'entregado'])
            .order('codigo');

        if (error) {
            console.error('[PedidosService] Error buscando pedidos de la mesa:', error.message);
            return [];
        }

        // Excluir los que ya están cubiertos por alguna factura
        // (antes esto se hacía armando un Set de IDs a mano).
        const disponibles = data.filter((p) => !p.factura_pedidos || p.factura_pedidos.length === 0);
        return disponibles.map(this._aplanar);
    },

    // ────────────────────────────────────────────────────────
    // CREACIÓN
    // ────────────────────────────────────────────────────────

    // datosPedido = { mesa, mozo, cliente, observacionGeneral, prioridad,
    //                  justificacionUrgente,
    //                  items: [{ platoId, nombre, precioUnitario, cantidad,
    //                            subtotal, adicionales: [{texto, extra}] }] }
    async crear(datosPedido) {
        if (!datosPedido.items || datosPedido.items.length === 0) {
            return { ok: false, mensaje: 'El pedido debe tener al menos un plato' };
        }

        const codigo = await this._siguienteCodigo();
        const total = datosPedido.items.reduce((s, i) => s + i.subtotal, 0);

        const { data: pedido, error: errorPedido } = await window.supabaseClient
            .from('pedidos')
            .insert({
                codigo,
                mesa: datosPedido.mesa,
                mozo: datosPedido.mozo,
                cliente: datosPedido.cliente || null,
                estado: 'registrado',
                estado_cocina: 'Pendiente',
                prioridad: datosPedido.prioridad || 'normal',
                justificacion_urgente: datosPedido.justificacionUrgente || null,
                observacion_general: datosPedido.observacionGeneral || null,
                total,
            })
            .select()
            .single();

        if (errorPedido) {
            console.error('[PedidosService] Error creando pedido:', errorPedido.message);
            return { ok: false, mensaje: errorPedido.message };
        }

        for (const item of datosPedido.items) {
            const { data: itemCreado, error: errorItem } = await window.supabaseClient
                .from('pedido_items')
                .insert({
                    pedido_id: pedido.id,
                    plato_id: item.platoId,
                    nombre_snapshot: item.nombre,
                    precio_unitario: item.precioUnitario,
                    cantidad: item.cantidad,
                    subtotal: item.subtotal,
                    estado_plato: 'Pendiente',
                    tiempo_estimado_min: item.tiempoEstimadoMin || 20,
                })
                .select()
                .single();

            if (errorItem) {
                console.error('[PedidosService] Error creando item de pedido:', errorItem.message);
                continue;
            }

            if (item.adicionales && item.adicionales.length > 0) {
                const filasAdicionales = item.adicionales.map((a) => ({
                    pedido_item_id: itemCreado.id,
                    texto: a.texto,
                    extra: a.extra || 0,
                }));
                await window.supabaseClient.from('pedido_item_adicionales').insert(filasAdicionales);
            }
        }

        return { ok: true, pedido: { ...pedido, codigo } };
    },

    // Añadir platos a un pedido existente de una mesa (caso
    // "pedidoExistente" del pedidos.js original).
    async agregarItems(pedidoId, items) {
        for (const item of items) {
            await window.supabaseClient.from('pedido_items').insert({
                pedido_id: pedidoId,
                plato_id: item.platoId,
                nombre_snapshot: item.nombre,
                precio_unitario: item.precioUnitario,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
                estado_plato: 'Pendiente',
                tiempo_estimado_min: item.tiempoEstimadoMin || 20,
            });
        }

        const nuevoTotal = await this._recalcularTotal(pedidoId);
        await window.supabaseClient.from('pedidos').update({ total: nuevoTotal }).eq('id', pedidoId);

        return { ok: true };
    },

    // Cancela un pedido (acción del Mozo desde pedidos.page.js).
    // No se puede cancelar un pedido ya pagado.
    async cancelar(pedidoId) {
        const { data: pedido, error: errorLectura } = await window.supabaseClient
            .from('pedidos')
            .select('estado')
            .eq('id', pedidoId)
            .single();

        if (errorLectura) {
            return { ok: false, mensaje: errorLectura.message };
        }
        if (pedido.estado === 'pagado') {
            return { ok: false, mensaje: 'No se puede cancelar un pedido ya pagado' };
        }

        const { error } = await window.supabaseClient.from('pedidos').update({ estado: 'cancelado' }).eq('id', pedidoId);
        if (error) {
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },

    // ────────────────────────────────────────────────────────
    // COCINA — máquina de estados
    // Migrado de cocina.js (ControlCocina.cambiarEstadoPlato /
    // cambiarEstadoPedido), con la misma regla de negocio: solo se
    // puede avanzar, nunca retroceder.
    // ────────────────────────────────────────────────────────

    ORDEN_ESTADOS: ['Pendiente', 'En preparación', 'Listo'],

    // Cambia el estado de UN item dentro de un pedido.
    async cambiarEstadoItem(itemId, nuevoEstado) {
        const { data: item, error: errorLectura } = await window.supabaseClient
            .from('pedido_items')
            .select('id, estado_plato, pedido_id, pedidos!inner(estado)')
            .eq('id', itemId)
            .single();

        if (errorLectura) {
            return { ok: false, mensaje: errorLectura.message };
        }

        if (item.pedidos.estado === 'cancelado') {
            return { ok: false, mensaje: 'No se puede modificar un pedido cancelado' };
        }

        const indiceActual = this.ORDEN_ESTADOS.indexOf(item.estado_plato || 'Pendiente');
        const indiceNuevo = this.ORDEN_ESTADOS.indexOf(nuevoEstado);

        if (indiceNuevo < indiceActual) {
            return { ok: false, mensaje: 'No se puede retroceder a un estado anterior' };
        }

        const { error } = await window.supabaseClient
            .from('pedido_items')
            .update({ estado_plato: nuevoEstado })
            .eq('id', itemId);

        if (error) {
            return { ok: false, mensaje: error.message };
        }

        await this._sincronizarEstadoCocinaPedido(item.pedido_id);
        return { ok: true };
    },

    // Cambia el estado de TODOS los items de un pedido a la vez
    // (botones "Iniciar preparación" / "Marcar todos como listos").
    async cambiarEstadoPedido(pedidoId, nuevoEstado) {
        const { data: pedido, error: errorLectura } = await window.supabaseClient
            .from('pedidos')
            .select('id, estado, estado_cocina, pedido_items(estado_plato)')
            .eq('id', pedidoId)
            .single();

        if (errorLectura) {
            return { ok: false, mensaje: errorLectura.message };
        }

        if (pedido.estado === 'cancelado') {
            return { ok: false, mensaje: 'No se puede modificar un pedido cancelado' };
        }

        if (nuevoEstado === 'Listo') {
            const yaEnCocina = pedido.pedido_items.some(
                (i) => i.estado_plato === 'En preparación' || i.estado_plato === 'Listo'
            );
            if (!yaEnCocina && pedido.estado_cocina === 'Pendiente') {
                return { ok: false, mensaje: 'El pedido debe iniciar preparación antes de marcarse como Listo' };
            }
        }

        // Actualizar items: mismo criterio que cocina.js — "Listo"
        // fuerza todos los items a Listo; "En preparación" solo
        // mueve los que estaban Pendiente, sin tocar los ya Listos.
        if (nuevoEstado === 'Listo') {
            await window.supabaseClient
                .from('pedido_items')
                .update({ estado_plato: 'Listo' })
                .eq('pedido_id', pedidoId);
        } else if (nuevoEstado === 'En preparación') {
            await window.supabaseClient
                .from('pedido_items')
                .update({ estado_plato: 'En preparación' })
                .eq('pedido_id', pedidoId)
                .eq('estado_plato', 'Pendiente');
        }

        const estadoPedido = nuevoEstado === 'Listo' ? 'entregado' : 'en_preparacion';

        const { error } = await window.supabaseClient
            .from('pedidos')
            .update({ estado: estadoPedido, estado_cocina: nuevoEstado })
            .eq('id', pedidoId);

        if (error) {
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },

    // Calcula el estado_cocina del pedido a partir de sus items,
    // igual que estadoGeneral() en el cocina.js original, y lo
    // persiste. Se llama después de cambiar un item individual.
    async _sincronizarEstadoCocinaPedido(pedidoId) {
        const { data: items, error } = await window.supabaseClient
            .from('pedido_items')
            .select('estado_plato')
            .eq('pedido_id', pedidoId);

        if (error || !items || items.length === 0) return;

        const estados = items.map((i) => i.estado_plato || 'Pendiente');
        let estadoGeneral = 'Pendiente';
        if (estados.every((e) => e === 'Listo')) {
            estadoGeneral = 'Listo';
        } else if (estados.some((e) => e === 'En preparación' || e === 'Listo')) {
            estadoGeneral = 'En preparación';
        }

        await window.supabaseClient.from('pedidos').update({ estado_cocina: estadoGeneral }).eq('id', pedidoId);
    },

    async _recalcularTotal(pedidoId) {
        const { data: items } = await window.supabaseClient
            .from('pedido_items')
            .select('subtotal')
            .eq('pedido_id', pedidoId);

        return (items || []).reduce((s, i) => s + parseFloat(i.subtotal), 0);
    },

    // ────────────────────────────────────────────────────────
    // INTERNOS
    // ────────────────────────────────────────────────────────

    async _siguienteCodigo() {
        const { data, error } = await window.supabaseClient
            .from('pedidos')
            .select('codigo')
            .order('creado_en', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) return 'PED001';

        const ultimoNumero = parseInt(data[0].codigo.replace('PED', ''), 10) || 0;
        return `PED${String(ultimoNumero + 1).padStart(3, '0')}`;
    },

    // Convierte la fila anidada de Supabase a un shape parecido al
    // objeto "pedido" plano que usaban pedidos.js/cocina.js, para
    // minimizar cambios en las funciones de render.
    _aplanar(fila) {
        return {
            id: fila.id,
            codigo: fila.codigo,
            mesa: fila.mesa,
            mozo: fila.mozo,
            cliente: fila.cliente,
            estado: fila.estado,
            estadoCocina: fila.estado_cocina,
            prioridad: fila.prioridad,
            urgente: fila.prioridad === 'urgente',
            justificacionUrgente: fila.justificacion_urgente || '',
            observaciones: fila.observacion_general || '',
            total: fila.total,
            fecha: fila.creado_en,
            platos: (fila.pedido_items || []).map((item) => ({
                id: item.id,
                platoId: item.plato_id,
                nombre: item.nombre_snapshot,
                precioUnitario: item.precio_unitario,
                cantidad: item.cantidad,
                subtotal: item.subtotal,
                estadoPlato: item.estado_plato,
                tiempo: item.tiempo_estimado_min,
                observaciones: (item.pedido_item_adicionales || []).map((a) => ({
                    texto: a.texto,
                    extra: a.extra,
                })),
            })),
        };
    },
};
