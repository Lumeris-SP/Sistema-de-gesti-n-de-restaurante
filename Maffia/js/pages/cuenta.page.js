// ============================================================
// js/pages/cuenta.page.js
// MAFFIA — Facturación / Cierre de cuenta
// ============================================================
// Reemplaza a cuenta.js. Cambios importantes:
//
//   - Esta página NO cargaba auth.js — cualquiera podía facturar
//     sin sesión. Ahora pasa por Auth.proteger(['Caja', 'Administrador']).
//   - Toda la capa de normalización defensiva del original
//     (getLS() reconciliando id/codigo, normalizarPlatos()
//     soportando 3 formatos distintos, pedidoFacturable()
//     adivinando el estado) desaparece. Esa complejidad existía
//     solo porque pedidos.js/cocina.js escribían el mismo dato de
//     formas distintas en localStorage. PedidosService.
//     listarFacturablesPorMesa() ya devuelve datos limpios y
//     consistentes.
//   - El cálculo de IGV/descuento se delega a
//     FacturasService.calcularTotales(), en vez de leer los
//     valores parseando texto de <span> en el DOM.
//
// Requiere supabaseClient.js, core/auth.js,
// services/pedidosService.js y services/facturasService.js
// cargados antes.
// ============================================================

let mesaActual = null;
let pedidosSeleccionados = [];

function formatMoney(val) {
    return 'S/ ' + parseFloat(val || 0).toFixed(2);
}

function showToast(msg, tipo = 'success') {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    const icon = toast.querySelector('.toast-icon');
    toast.className = 'toast ' + tipo;
    toastMsg.textContent = msg;
    icon.className = 'toast-icon fas ' + (tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
    toast.classList.remove('hidden');
    clearTimeout(window._toastTimer);
    window._toastTimer = setTimeout(() => toast.classList.add('hidden'), 3500);
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach((el) => (el.textContent = ''));
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

document.addEventListener('DOMContentLoaded', async () => {
    const autorizado = await Auth.proteger(['Caja', 'Administrador']);
    if (!autorizado) return;

    document.querySelectorAll('.tab-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach((t) => t.classList.add('active'));
            btn.classList.add('active');
            document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
            if (btn.dataset.tab === 'cuentas-guardadas') renderFacturas();
        });
    });

    document.getElementById('btn-buscar-mesa').addEventListener('click', buscarMesa);
    document.getElementById('input-mesa').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') buscarMesa();
    });

    document.getElementById('buscador-facturas').addEventListener('input', renderFacturas);
    document.getElementById('filtro-estado-factura').addEventListener('change', renderFacturas);

    document.querySelectorAll('input[name="aplicar-descuento"]').forEach((r) =>
        r.addEventListener('change', () => {
            document.getElementById('bloque-descuento').classList.toggle('hidden', r.value !== 'si' || !r.checked);
            armarResumen();
        })
    );
    document.getElementById('tipo-descuento')?.addEventListener('change', armarResumen);
    document.getElementById('valor-descuento')?.addEventListener('input', armarResumen);
    document.querySelectorAll('input[name="con-igv"]').forEach((r) => r.addEventListener('change', armarResumen));
    document.getElementById('monto-recibido')?.addEventListener('input', actualizarVuelto);
});

// ────────────────────────────────────────────────────────────
// PASO 1 — BUSCAR MESA
// ────────────────────────────────────────────────────────────

async function buscarMesa() {
    clearErrors();
    const inputEl = document.getElementById('input-mesa');
    const mesa = parseInt(inputEl.value);

    if (!inputEl.value.trim()) {
        showError('error-mesa', 'Ingrese un número de mesa.');
        return;
    }
    if (isNaN(mesa) || mesa < 1 || mesa > 50) {
        showError('error-mesa', 'El número de mesa debe estar entre 1 y 50.');
        return;
    }

    const disponibles = await PedidosService.listarFacturablesPorMesa(mesa);

    if (disponibles.length === 0) {
        showError(
            'error-mesa',
            'No hay pedidos listos para cobrar en esta mesa. Primero márcalos como Listos en Cocina.'
        );
        document.getElementById('paso-pedidos').classList.add('hidden');
        document.getElementById('paso-pago').classList.add('hidden');
        return;
    }

    mesaActual = mesa;
    renderPedidosMesa(disponibles);
    document.getElementById('paso-pedidos').classList.remove('hidden');
    document.getElementById('label-mesa-seleccionada').textContent = 'Mesa #' + mesa;
}

// ────────────────────────────────────────────────────────────
// PASO 2 — PEDIDOS DE LA MESA
// ────────────────────────────────────────────────────────────

function renderPedidosMesa(pedidos) {
    const container = document.getElementById('lista-pedidos-mesa');
    container.innerHTML = '';

    pedidos.forEach((pedido) => {
        const fechaMostrar = pedido.fecha
            ? new Date(pedido.fecha).toLocaleString('es-PE', {
                  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })
            : '—';

        const filas = (pedido.platos || [])
            .map((p) => {
                const obs = Array.isArray(p.observaciones) ? p.observaciones.map((o) => o.texto).join(', ') : '';
                return `
                    <tr>
                        <td style="padding:5px 8px">${p.nombre}</td>
                        <td style="text-align:center;padding:5px 8px">${p.cantidad}</td>
                        <td style="text-align:right;padding:5px 8px">${formatMoney(p.precioUnitario)}</td>
                        <td style="text-align:right;font-weight:600;padding:5px 8px">${formatMoney(p.subtotal)}</td>
                        <td style="font-size:0.75rem;color:var(--text-muted);font-style:italic;padding:5px 8px">${obs}</td>
                    </tr>`;
            })
            .join('');

        const card = document.createElement('div');
        card.className = 'pedido-item-card';
        card.innerHTML = `
            <div class="pedido-item-header">
                <span class="pedido-code"><i class="fas fa-hashtag"></i> ${pedido.codigo}</span>
                <span class="pedido-meta">
                    <i class="fas fa-user"></i> ${pedido.mozo || '—'} &nbsp;|&nbsp;
                    <i class="fas fa-clock"></i> ${fechaMostrar}
                </span>
                <span class="prioridad-${(pedido.prioridad || 'normal').toLowerCase()}">
                    <i class="fas fa-flag"></i> ${pedido.prioridad || 'Normal'}
                </span>
            </div>
            <table style="width:100%;border-collapse:collapse;margin-top:8px">
                <thead>
                    <tr style="font-size:0.72rem;color:var(--text-muted);text-transform:uppercase;border-bottom:1px solid var(--dark-border)">
                        <th style="text-align:left;padding:4px 8px">Plato</th>
                        <th style="text-align:center;padding:4px 8px">Cant.</th>
                        <th style="text-align:right;padding:4px 8px">P. Unit.</th>
                        <th style="text-align:right;padding:4px 8px">Subtotal</th>
                        <th style="padding:4px 8px">Obs.</th>
                    </tr>
                </thead>
                <tbody style="font-size:0.85rem">${filas}</tbody>
            </table>`;
        container.appendChild(card);
    });

    pedidosSeleccionados = pedidos;

    armarResumen();
    document.getElementById('paso-pago').classList.remove('hidden');

    setTimeout(() => {
        document.getElementById('paso-pago').scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
}

// ────────────────────────────────────────────────────────────
// PASO 3 — RESUMEN Y CÁLCULOS
// El cálculo numérico ahora vive en FacturasService.calcularTotales();
// aquí solo se leen los inputs del formulario y se pinta el resultado.
// ────────────────────────────────────────────────────────────

function leerOpcionesDescuentoIgv() {
    const aplicarDescuento = document.querySelector('input[name="aplicar-descuento"]:checked')?.value === 'si';
    const tipoDescuento = document.getElementById('tipo-descuento')?.value || 'porcentaje';
    const valorDescuento = parseFloat(document.getElementById('valor-descuento')?.value) || 0;
    const conIgv = document.querySelector('input[name="con-igv"]:checked')?.value !== 'no';
    return { aplicarDescuento, tipoDescuento, valorDescuento, conIgv };
}

function armarResumen() {
    const tablaContainer = document.getElementById('tabla-resumen-items');
    if (!tablaContainer) return;
    tablaContainer.innerHTML = '';
    if (pedidosSeleccionados.length === 0) return;

    const todosLosItems = pedidosSeleccionados.flatMap((p) => p.platos || []);

    tablaContainer.innerHTML = todosLosItems
        .map(
            (p) => `
        <tr>
            <td style="padding:5px 8px">${p.nombre} <span style="color:var(--text-muted)">x${p.cantidad}</span></td>
            <td style="text-align:right;padding:5px 8px">${formatMoney(p.subtotal)}</td>
        </tr>`
        )
        .join('');

    const opciones = leerOpcionesDescuentoIgv();
    const totales = FacturasService.calcularTotales(todosLosItems, opciones);

    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = formatMoney(val);
    };
    set('resumen-subtotal', totales.subtotal);
    set('resumen-descuento', totales.descuento);
    set('resumen-igv', totales.igv);
    set('resumen-total', totales.total);

    actualizarVuelto();
}

function actualizarVuelto() {
    const totalEl = document.getElementById('resumen-total');
    if (!totalEl) return;
    const total = parseFloat(totalEl.textContent.replace('S/', '').trim()) || 0;
    const montoInput = document.getElementById('monto-recibido');
    const vueltoEl = document.getElementById('resumen-vuelto');
    if (!montoInput || !vueltoEl) return;

    const vuelto = FacturasService.calcularVuelto(total, montoInput.value);
    vueltoEl.textContent = formatMoney(vuelto);
}

// ────────────────────────────────────────────────────────────
// PASO 4 — CONFIRMAR PAGO
// ────────────────────────────────────────────────────────────

async function confirmarPago() {
    clearErrors();

    const metodoPagoEl = document.querySelector('input[name="metodo-pago"]:checked');
    if (!metodoPagoEl) {
        showError('error-pago', 'Seleccione un método de pago.');
        return;
    }

    const todosLosItems = pedidosSeleccionados.flatMap((p) => p.platos || []);
    const opciones = leerOpcionesDescuentoIgv();
    const totales = FacturasService.calcularTotales(todosLosItems, opciones);

    const montoRecibido =
        metodoPagoEl.value === 'Efectivo' ? parseFloat(document.getElementById('monto-recibido').value) : null;
    const vuelto =
        metodoPagoEl.value === 'Efectivo' ? FacturasService.calcularVuelto(totales.total, montoRecibido) : null;

    const resultado = await FacturasService.crear({
        mesa: mesaActual,
        pedidosIds: pedidosSeleccionados.map((p) => p.id),
        subtotal: totales.subtotal,
        descuento: totales.descuento,
        justificacionDescuento: document.getElementById('justificacion-descuento')?.value.trim() || '',
        conIgv: opciones.conIgv,
        igv: totales.igv,
        total: totales.total,
        metodoPago: metodoPagoEl.value,
        montoRecibido,
        vuelto,
    });

    if (!resultado.ok) {
        showError('error-pago', resultado.mensaje);
        return;
    }

    showToast(`Cuenta de la Mesa ${mesaActual} cobrada exitosamente (${resultado.factura.codigo})`);

    _facturasCache = []; // invalidar para que "Cuentas Guardadas" muestre datos frescos

    document.getElementById('input-mesa').value = '';
    document.getElementById('paso-pedidos').classList.add('hidden');
    document.getElementById('paso-pago').classList.add('hidden');
    mesaActual = null;
    pedidosSeleccionados = [];
}

// ────────────────────────────────────────────────────────────
// PESTAÑA: CUENTAS GUARDADAS
// ────────────────────────────────────────────────────────────

let _facturasCache = [];

async function renderFacturas() {
    if (_facturasCache.length === 0) {
        _facturasCache = await FacturasService.listar();
    }

    const container = document.getElementById('lista-facturas');
    const busqueda = document.getElementById('buscador-facturas').value.toLowerCase();
    const filtroEstado = document.getElementById('filtro-estado-factura').value;

    const filtradas = _facturasCache.filter((f) => {
        const matchBusqueda = f.codigo.toLowerCase().includes(busqueda) || String(f.mesa).includes(busqueda);
        const matchEstado = !filtroEstado || f.estado === filtroEstado;
        return matchBusqueda && matchEstado;
    });

    if (filtradas.length === 0) {
        container.innerHTML = `<div class="empty-state"><i class="fas fa-file-invoice"></i><p>No se encontraron facturas.</p></div>`;
        return;
    }

    container.innerHTML = '';
    filtradas.forEach((f) => {
        const estadoClass = f.estado === 'Pagada' ? 'estado-pagada' : 'estado-anulada';
        const estadoIcon = f.estado === 'Pagada' ? 'fa-check-circle' : 'fa-ban';
        const fecha = new Date(f.creado_en).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
        });
        const numPedidos = (f.factura_pedidos || []).length;

        const card = document.createElement('div');
        card.className = 'factura-card';
        card.innerHTML = `
            <div class="factura-card-header">
                <span class="factura-code"><i class="fas fa-file-invoice"></i> ${f.codigo}</span>
                <span class="estado-badge ${estadoClass}"><i class="fas ${estadoIcon}"></i> ${f.estado}</span>
                <span class="factura-total">${formatMoney(f.total)}</span>
            </div>
            <div class="factura-info">
                <span><i class="fas fa-table"></i> Mesa ${f.mesa}</span>
                <span><i class="fas fa-clock"></i> ${fecha}</span>
                <span><i class="fas fa-wallet"></i> ${f.metodo_pago}</span>
                <span><i class="fas fa-receipt"></i> ${numPedidos} pedido(s)</span>
            </div>
            <div class="factura-actions">
                ${f.estado !== 'Anulada' ? `
                <button class="btn-danger btn-sm" onclick="anularFactura('${f.id}')">
                    <i class="fas fa-ban"></i> Anular
                </button>` : `
                <span style="font-size:0.75rem;color:var(--text-dim);padding:0.35rem 0.5rem">
                    <i class="fas fa-info-circle"></i>
                    ${f.motivo_anulacion ? 'Motivo: ' + f.motivo_anulacion : 'Anulada'}
                </span>`}
            </div>`;
        container.appendChild(card);
    });
}

async function anularFactura(facturaId) {
    const motivo = prompt('Motivo de la anulación (opcional):') || '';
    if (!confirm('¿Confirmas anular esta factura? Los pedidos volverán a estar disponibles para cobrar.')) return;

    const resultado = await FacturasService.anular(facturaId, motivo);
    if (!resultado.ok) {
        showToast(resultado.mensaje, 'error');
        return;
    }
    _facturasCache = [];
    await renderFacturas();
    showToast('Factura anulada correctamente');
}
