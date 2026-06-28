// ============================================================
// js/services/facturasService.js
// MAFFIA — Acceso a datos: facturas
// ============================================================
// Reemplaza la lógica de cuenta.js que calculaba IGV/descuento
// "a mano" leyendo el DOM (parseMoney() de un <span> de texto) y
// guardaba el resultado en localStorage.getItem('facturas'). El
// cálculo numérico ahora vive aquí — page.js solo le pasa los
// valores crudos (subtotal, datos del descuento) y muestra el
// resultado, sin tener que reimplementar la fórmula del IGV en
// cada lugar que la necesite.
// ============================================================

const FacturasService = {
    IGV_TASA: 0.18,

    // Calcula subtotal/descuento/igv/total a partir de una lista
    // de items {subtotal} y las opciones de descuento/IGV elegidas
    // en el formulario. Misma fórmula que recalcular() en cuenta.js.
    calcularTotales(items, opciones) {
        opciones = opciones || {};
        const subtotal = items.reduce((s, i) => s + (parseFloat(i.subtotal) || 0), 0);

        let descuento = 0;
        if (opciones.aplicarDescuento) {
            const valor = parseFloat(opciones.valorDescuento) || 0;
            descuento =
                opciones.tipoDescuento === 'porcentaje' ? (subtotal * valor) / 100 : valor;
            descuento = Math.max(0, Math.min(descuento, subtotal));
        }

        const base = subtotal - descuento;
        const igv = opciones.conIgv ? base * this.IGV_TASA : 0;
        const total = base + igv;

        return { subtotal, descuento, igv, total };
    },

    calcularVuelto(total, montoRecibido) {
        return Math.max(0, (parseFloat(montoRecibido) || 0) - total);
    },

    // ────────────────────────────────────────────────────────
    // LECTURA
    // ────────────────────────────────────────────────────────

    async listar() {
        const { data, error } = await window.supabaseClient
            .from('facturas')
            .select(`
                id, codigo, mesa, subtotal, descuento, justificacion_descuento,
                con_igv, igv, total, metodo_pago, monto_recibido, vuelto,
                estado, motivo_anulacion, creado_en,
                factura_pedidos ( pedido_id )
            `)
            .order('creado_en', { ascending: false });

        if (error) {
            console.error('[FacturasService] Error listando facturas:', error.message);
            return [];
        }
        return data;
    },

    // ────────────────────────────────────────────────────────
    // CREACIÓN
    // ────────────────────────────────────────────────────────

    // datos = { mesa, pedidosIds: [uuid...], subtotal, descuento,
    //           justificacionDescuento, conIgv, igv, total,
    //           metodoPago, montoRecibido, vuelto }
    async crear(datos) {
        if (!datos.metodoPago) {
            return { ok: false, mensaje: 'Seleccione un método de pago' };
        }
        if (datos.metodoPago === 'Efectivo') {
            if (datos.montoRecibido == null || isNaN(datos.montoRecibido)) {
                return { ok: false, mensaje: 'Ingrese el monto recibido' };
            }
            if (datos.montoRecibido < datos.total) {
                return { ok: false, mensaje: 'El monto recibido es menor al total a pagar' };
            }
        }

        const codigo = await this._siguienteCodigo();

        const { data: factura, error: errorFactura } = await window.supabaseClient
            .from('facturas')
            .insert({
                codigo,
                mesa: datos.mesa,
                subtotal: datos.subtotal,
                descuento: datos.descuento,
                justificacion_descuento: datos.justificacionDescuento || null,
                con_igv: datos.conIgv,
                igv: datos.igv,
                total: datos.total,
                metodo_pago: datos.metodoPago,
                monto_recibido: datos.metodoPago === 'Efectivo' ? datos.montoRecibido : null,
                vuelto: datos.metodoPago === 'Efectivo' ? datos.vuelto : null,
                estado: 'Pagada',
            })
            .select()
            .single();

        if (errorFactura) {
            console.error('[FacturasService] Error creando factura:', errorFactura.message);
            return { ok: false, mensaje: errorFactura.message };
        }

        const filasRelacion = datos.pedidosIds.map((pedidoId) => ({
            factura_id: factura.id,
            pedido_id: pedidoId,
        }));
        await window.supabaseClient.from('factura_pedidos').insert(filasRelacion);

        // Marcar los pedidos como pagados — reemplaza el bloque de
        // cuenta.js que movía los pedidos a un "historial" aparte
        // en localStorage para evitar doble facturación. Aquí basta
        // con el estado 'pagado' más la fila en factura_pedidos.
        await window.supabaseClient
            .from('pedidos')
            .update({ estado: 'pagado' })
            .in('id', datos.pedidosIds);

        return { ok: true, factura: { ...factura, codigo } };
    },

    async _siguienteCodigo() {
        const { data, error } = await window.supabaseClient
            .from('facturas')
            .select('codigo')
            .order('creado_en', { ascending: false })
            .limit(1);

        if (error || !data || data.length === 0) return 'FAC001';

        const ultimoNumero = parseInt(data[0].codigo.replace('FAC', ''), 10) || 0;
        return `FAC${String(ultimoNumero + 1).padStart(3, '0')}`;
    },

    // Anula una factura (no la borra, igual que el original — solo
    // cambia su estado para conservar el historial). Los pedidos
    // que cubría vuelven a quedar disponibles para facturar.
    async anular(facturaId, motivo) {
        const { data: relaciones } = await window.supabaseClient
            .from('factura_pedidos')
            .select('pedido_id')
            .eq('factura_id', facturaId);

        const { error } = await window.supabaseClient
            .from('facturas')
            .update({ estado: 'Anulada', motivo_anulacion: motivo || null })
            .eq('id', facturaId);

        if (error) {
            return { ok: false, mensaje: error.message };
        }

        if (relaciones && relaciones.length > 0) {
            const idsPedidos = relaciones.map((r) => r.pedido_id);
            await window.supabaseClient.from('pedidos').update({ estado: 'listo' }).in('id', idsPedidos);
        }

        return { ok: true };
    },
};
