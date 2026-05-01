/* ===========================
   CUENTA.JS - Módulo Facturación
   MAFFIA Restaurante Oriental
   Lee de: localStorage 'pedidos_maffia'  (escrito por pedidos.js)
   Escribe: localStorage 'facturas_maffia'
   =========================== */

// ============================================================
// UTILIDADES
// ============================================================
function getLS(key) {
    try { return JSON.parse(localStorage.getItem(key)) || []; }
    catch { return []; }
}
function setLS(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function fmt(val) {
    return 'S/ ' + parseFloat(val || 0).toFixed(2);
}

function parseFmt(str) {
    return parseFloat((str || '').replace('S/ ', '').replace(',', '.')) || 0;
}

function getFechaHora() {
    return new Date().toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function generarCodigoFactura() {
    const facturas = getLS('facturas_maffia');
    return 'FAC' + String(facturas.length + 1).padStart(3, '0');
}

function showToast(msg, tipo = 'success') {
    const t = document.getElementById('toast');
    const icon = t.querySelector('.toast-icon');
    t.className = 'toast ' + tipo;
    document.getElementById('toast-msg').textContent = msg;
    icon.className = 'toast-icon fas ' + (tipo === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
    t.classList.remove('hidden');
    clearTimeout(window._toast);
    window._toast = setTimeout(() => t.classList.add('hidden'), 3500);
}

function clearErrors() {
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}
function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

// ============================================================
// ESTADO GLOBAL
// ============================================================
let mesaActual = null;
let pedidosDisponibles = [];
let facturaEnAnulacion = null;

// ============================================================
// TABS
// ============================================================
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
        if (btn.dataset.tab === 'cuentas-guardadas') renderFacturas();
    });
});

// ============================================================
// PASO 1 — BUSCAR MESA
// ============================================================
document.getElementById('btn-buscar-mesa').addEventListener('click', buscarMesa);
document.getElementById('input-mesa').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarMesa();
});

function buscarMesa() {
    clearErrors();
    const inputEl = document.getElementById('input-mesa');
    const mesa = parseInt(inputEl.value);

    if (!inputEl.value.trim() || isNaN(mesa) || mesa < 1 || mesa > 50) {
        showError('error-mesa', 'Ingrese un número de mesa válido (1 – 50).');
        return;
    }

    // Leer pedidos del localStorage escrito por pedidos.js
    const todosPedidos = getLS('pedidos_maffia');

    // Pedidos entregados de esa mesa
    const entregados = todosPedidos.filter(p =>
        parseInt(p.mesa) === mesa && p.estado === 'entregado'
    );

    if (entregados.length === 0) {
        showError('error-mesa',
            todosPedidos.some(p => parseInt(p.mesa) === mesa)
                ? 'Esta mesa tiene pedidos pero aún no están marcados como "Entregado".'
                : 'No se encontraron pedidos para esta mesa.'
        );
        document.getElementById('paso-pedidos').classList.add('hidden');
        document.getElementById('paso-pago').classList.add('hidden');
        return;
    }

    // Excluir los que ya fueron facturados (en facturas no anuladas)
    const facturas = getLS('facturas_maffia');
    const codigosFacturados = new Set();
    facturas.forEach(f => {
        if (f.estado !== 'Anulada') {
            (f.codigosPedidos || []).forEach(c => codigosFacturados.add(c));
        }
    });

    pedidosDisponibles = entregados.filter(p => !codigosFacturados.has(p.codigo));

    if (pedidosDisponibles.length === 0) {
        showError('error-mesa', 'Todos los pedidos entregados de esta mesa ya fueron facturados.');
        document.getElementById('paso-pedidos').classList.add('hidden');
        document.getElementById('paso-pago').classList.add('hidden');
        return;
    }

    mesaActual = mesa;
    document.getElementById('label-mesa-seleccionada').textContent = 'Mesa #' + mesa;
    renderPedidosMesa();
    document.getElementById('paso-pedidos').classList.remove('hidden');
    document.getElementById('paso-pago').classList.add('hidden');
}

// ============================================================
// PASO 2 — MOSTRAR PEDIDOS DE LA MESA
// ============================================================
function renderPedidosMesa() {
    const container = document.getElementById('lista-pedidos-mesa');
    container.innerHTML = '';

    pedidosDisponibles.forEach(p => {
        const fecha = new Date(p.fecha).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });

        const filasPlatos = (p.platos || []).map(pl => {
            const obsTexto = (pl.observaciones || []).map(o => o.texto).filter(Boolean).join(', ');
            return `
                <tr>
                    <td>${pl.nombre}</td>
                    <td class="td-cant">x${pl.cantidad}</td>
                    <td class="td-precio">${fmt(pl.precioUnitario)}</td>
                    <td class="td-subtotal">${fmt(pl.subtotal)}</td>
                    <td style="font-size:0.75rem;color:#aaa;font-style:italic">${obsTexto || '—'}</td>
                </tr>`;
        }).join('');

        const card = document.createElement('div');
        card.className = 'pedido-item-card';
        card.innerHTML = `
            <div class="pedido-item-header">
                <span class="pedido-code"><i class="fas fa-hashtag"></i> ${p.codigo}</span>
                <span class="pedido-meta">
                    <i class="fas fa-user-tie"></i> ${p.mozo}
                    &nbsp;|&nbsp;
                    <i class="fas fa-clock"></i> ${fecha}
                </span>
                <span class="prioridad-${p.prioridad || 'normal'}">
                    <i class="fas fa-flag"></i> ${(p.prioridad || 'normal').charAt(0).toUpperCase() + (p.prioridad || 'normal').slice(1)}
                </span>
            </div>
            <table class="pedido-platos-table">
                <thead>
                    <tr>
                        <th>Plato</th>
                        <th style="text-align:center">Cant.</th>
                        <th style="text-align:right">P.Unit.</th>
                        <th style="text-align:right">Subtotal</th>
                        <th>Observaciones</th>
                    </tr>
                </thead>
                <tbody>${filasPlatos}</tbody>
            </table>
            ${p.observacionGeneral
                ? `<p style="font-size:0.78rem;color:#aaa;margin:0.5rem 0 0;font-style:italic">
                        <i class="fas fa-comment"></i> ${p.observacionGeneral}
                   </p>`
                : ''}
        `;
        container.appendChild(card);
    });

    armarResumen();
    document.getElementById('paso-pago').classList.remove('hidden');
}

// ============================================================
// PASO 3 — RESUMEN Y CÁLCULOS
// ============================================================
function armarResumen() {
    const tablaContainer = document.getElementById('tabla-resumen-items');
    tablaContainer.innerHTML = '';

    const mapa = {};
    pedidosDisponibles.forEach(p => {
        (p.platos || []).forEach(pl => {
            if (mapa[pl.nombre]) {
                mapa[pl.nombre].cantidad += pl.cantidad;
                mapa[pl.nombre].subtotal += pl.subtotal;
            } else {
                mapa[pl.nombre] = {
                    nombre: pl.nombre,
                    precioUnitario: pl.precioUnitario,
                    cantidad: pl.cantidad,
                    subtotal: pl.subtotal
                };
            }
        });
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'tabla-resumen-wrap';
    wrapper.innerHTML = `
        <div class="resumen-item-row resumen-header-row">
            <span class="ri-nombre">Plato</span>
            <span class="ri-cant">Cant.</span>
            <span class="ri-precio">P. Unit.</span>
            <span class="ri-subtotal">Subtotal</span>
        </div>
    `;

    Object.values(mapa).forEach(item => {
        const row = document.createElement('div');
        row.className = 'resumen-item-row';
        row.innerHTML = `
            <span class="ri-nombre">${item.nombre}</span>
            <span class="ri-cant">x${item.cantidad}</span>
            <span class="ri-precio">${fmt(item.precioUnitario)}</span>
            <span class="ri-subtotal">${fmt(item.subtotal)}</span>
        `;
        wrapper.appendChild(row);
    });

    tablaContainer.appendChild(wrapper);
    recalcular();
}

function recalcular() {
    let subtotal = 0;
    pedidosDisponibles.forEach(p => {
        (p.platos || []).forEach(pl => { subtotal += parseFloat(pl.subtotal || 0); });
    });

    let descuento = 0;
    if (document.getElementById('chk-descuento').checked) {
        const tipo = document.getElementById('tipo-descuento').value;
        const valor = parseFloat(document.getElementById('input-descuento').value) || 0;
        descuento = tipo === 'porcentaje' ? (subtotal * valor) / 100 : valor;
        if (descuento > subtotal) descuento = subtotal;
        if (descuento < 0) descuento = 0;
    }

    const baseCalculo = subtotal - descuento;
    const igv = document.getElementById('chk-igv').checked ? baseCalculo * 0.18 : 0;
    const total = baseCalculo + igv;

    document.getElementById('val-subtotal').textContent = fmt(subtotal);
    document.getElementById('val-descuento').textContent = '- ' + fmt(descuento);
    document.getElementById('val-igv').textContent = fmt(igv);
    document.getElementById('val-total').textContent = fmt(total);

    calcularVuelto();
}

document.getElementById('chk-descuento').addEventListener('change', function () {
    document.getElementById('descuento-form').classList.toggle('hidden', !this.checked);
    if (!this.checked) {
        document.getElementById('input-descuento').value = '';
        document.getElementById('input-justificacion-desc').value = '';
    }
    recalcular();
});
document.getElementById('tipo-descuento').addEventListener('change', recalcular);
document.getElementById('input-descuento').addEventListener('input', recalcular);
document.getElementById('chk-igv').addEventListener('change', recalcular);

// ============================================================
// MÉTODO DE PAGO
// ============================================================
document.querySelectorAll('input[name="metodo-pago"]').forEach(r => {
    r.addEventListener('change', function () {
        document.getElementById('efectivo-fields').classList.toggle('hidden', this.value !== 'Efectivo');
        if (this.value !== 'Efectivo') {
            document.getElementById('input-monto-recibido').value = '';
            document.getElementById('display-vuelto').value = '';
        }
    });
});

document.getElementById('input-monto-recibido').addEventListener('input', calcularVuelto);

function calcularVuelto() {
    const total = parseFmt(document.getElementById('val-total').textContent);
    const monto = parseFloat(document.getElementById('input-monto-recibido').value) || 0;
    const vueltoEl = document.getElementById('display-vuelto');
    if (monto >= total && monto > 0) {
        vueltoEl.value = fmt(monto - total);
        vueltoEl.style.color = 'var(--success)';
    } else if (monto > 0) {
        vueltoEl.value = '⚠ Insuficiente';
        vueltoEl.style.color = 'var(--danger)';
    } else {
        vueltoEl.value = '';
    }
}

// ============================================================
// CONFIRMAR PAGO
// ============================================================
document.getElementById('btn-confirmar-pago').addEventListener('click', confirmarPago);

function confirmarPago() {
    clearErrors();
    let valido = true;

    if (document.getElementById('chk-descuento').checked) {
        const tipo = document.getElementById('tipo-descuento').value;
        const valorDesc = parseFloat(document.getElementById('input-descuento').value);
        const subtotal = parseFmt(document.getElementById('val-subtotal').textContent);
        const justDesc = document.getElementById('input-justificacion-desc').value.trim();

        if (isNaN(valorDesc) || valorDesc < 0) {
            showError('error-descuento', 'El descuento no puede ser negativo.');
            valido = false;
        } else if (tipo === 'monto' && valorDesc > subtotal) {
            showError('error-descuento', 'El descuento no puede superar el subtotal.');
            valido = false;
        } else if (tipo === 'porcentaje' && (valorDesc < 0 || valorDesc > 100)) {
            showError('error-descuento', 'El porcentaje debe estar entre 0 y 100.');
            valido = false;
        }
        if (justDesc.length < 10) {
            showError('error-justificacion-desc', 'La justificación debe tener al menos 10 caracteres.');
            valido = false;
        }
    }

    const metodoPago = document.querySelector('input[name="metodo-pago"]:checked');
    if (!metodoPago) {
        showError('error-metodo-pago', 'Seleccione un método de pago.');
        valido = false;
    }

    if (metodoPago && metodoPago.value === 'Efectivo') {
        const total = parseFmt(document.getElementById('val-total').textContent);
        const monto = parseFloat(document.getElementById('input-monto-recibido').value);
        if (isNaN(monto) || monto < 0) {
            showError('error-monto-recibido', 'Ingrese el monto recibido.');
            valido = false;
        } else if (monto < total) {
            showError('error-monto-recibido', `Monto insuficiente. Falta ${fmt(total - monto)}.`);
            valido = false;
        }
    }

    if (!valido) return;

    const subtotal = parseFmt(document.getElementById('val-subtotal').textContent);
    const descuento = parseFmt(document.getElementById('val-descuento').textContent.replace('- ', ''));
    const igv = parseFmt(document.getElementById('val-igv').textContent);
    const total = parseFmt(document.getElementById('val-total').textContent);
    const montoRecibido = metodoPago.value === 'Efectivo'
        ? parseFloat(document.getElementById('input-monto-recibido').value) || 0
        : null;

    const factura = {
        id: generarCodigoFactura(),
        mesa: mesaActual,
        codigosPedidos: pedidosDisponibles.map(p => p.codigo),
        pedidos: pedidosDisponibles,
        subtotal,
        descuento,
        justificacionDescuento: document.getElementById('chk-descuento').checked
            ? document.getElementById('input-justificacion-desc').value.trim()
            : '',
        conIgv: document.getElementById('chk-igv').checked,
        igv,
        total,
        metodoPago: metodoPago.value,
        montoRecibido,
        vuelto: metodoPago.value === 'Efectivo' ? Math.max(0, montoRecibido - total) : null,
        estado: 'Pagada',
        fechaHora: getFechaHora()
    };

    // Guardar factura
    const facturas = getLS('facturas_maffia');
    facturas.push(factura);
    setLS('facturas_maffia', facturas);

    // Marcar pedidos como 'facturado' en localStorage
    const todosPedidos = getLS('pedidos_maffia');
    factura.codigosPedidos.forEach(codigo => {
        const p = todosPedidos.find(pd => pd.codigo === codigo);
        if (p) p.estado = 'facturado';
    });
    setLS('pedidos_maffia', todosPedidos);

    showToast('¡Pago confirmado! Factura ' + factura.id + ' generada.', 'success');
    mostrarTicket(factura);
    resetFormulario();
}

// ============================================================
// RESET
// ============================================================
function resetFormulario() {
    mesaActual = null;
    pedidosDisponibles = [];
    document.getElementById('input-mesa').value = '';
    document.getElementById('paso-pedidos').classList.add('hidden');
    document.getElementById('paso-pago').classList.add('hidden');
    document.getElementById('lista-pedidos-mesa').innerHTML = '';
    document.getElementById('tabla-resumen-items').innerHTML = '';
    document.getElementById('chk-descuento').checked = false;
    document.getElementById('descuento-form').classList.add('hidden');
    document.getElementById('input-descuento').value = '';
    document.getElementById('input-justificacion-desc').value = '';
    document.getElementById('chk-igv').checked = true;
    document.querySelectorAll('input[name="metodo-pago"]').forEach(r => r.checked = false);
    document.getElementById('efectivo-fields').classList.add('hidden');
    document.getElementById('input-monto-recibido').value = '';
    document.getElementById('display-vuelto').value = '';
    document.getElementById('val-subtotal').textContent = 'S/ 0.00';
    document.getElementById('val-descuento').textContent = '- S/ 0.00';
    document.getElementById('val-igv').textContent = 'S/ 0.00';
    document.getElementById('val-total').textContent = 'S/ 0.00';
    clearErrors();
}

document.getElementById('btn-cancelar-cuenta').addEventListener('click', resetFormulario);

// ============================================================
// TICKET
// ============================================================
function mostrarTicket(f) {
    const itemsHTML = f.pedidos.flatMap(p =>
        (p.platos || []).map(pl => `
            <div class="ticket-item-row">
                <span>${pl.nombre} x${pl.cantidad}</span>
                <span>${fmt(pl.subtotal)}</span>
            </div>`)
    ).join('');

    document.getElementById('ticket-contenido').innerHTML = `
        <div class="ticket-row"><span><i class="fas fa-hashtag"></i> Factura</span><span><b>${f.id}</b></span></div>
        <div class="ticket-row"><span><i class="fas fa-table"></i> Mesa</span><span>${f.mesa}</span></div>
        <div class="ticket-row"><span><i class="fas fa-clock"></i> Fecha</span><span>${f.fechaHora}</span></div>
        <div class="ticket-line"></div>
        ${itemsHTML}
        <div class="ticket-line"></div>
        <div class="ticket-row"><span>Subtotal</span><span>${fmt(f.subtotal)}</span></div>
        ${f.descuento > 0 ? `<div class="ticket-row" style="color:var(--danger)"><span>Descuento</span><span>- ${fmt(f.descuento)}</span></div>` : ''}
        ${f.conIgv ? `<div class="ticket-row"><span>IGV (18%)</span><span>${fmt(f.igv)}</span></div>` : ''}
        <div class="ticket-row total-ticket"><span>TOTAL</span><span>${fmt(f.total)}</span></div>
        <div class="ticket-line"></div>
        <div class="ticket-row"><span>Método de pago</span><span>${f.metodoPago}</span></div>
        ${f.metodoPago === 'Efectivo' ? `
            <div class="ticket-row"><span>Monto recibido</span><span>${fmt(f.montoRecibido)}</span></div>
            <div class="ticket-row" style="color:var(--success)"><span>Vuelto</span><span>${fmt(f.vuelto)}</span></div>` : ''}
    `;
    document.getElementById('modal-ticket').classList.remove('hidden');
}

document.getElementById('btn-cerrar-ticket').addEventListener('click', () => {
    document.getElementById('modal-ticket').classList.add('hidden');
});
document.getElementById('btn-imprimir-ticket').addEventListener('click', () => window.print());
document.getElementById('modal-ticket').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
});

// ============================================================
// HISTORIAL DE FACTURAS
// ============================================================
function renderFacturas() {
    const facturas = getLS('facturas_maffia').slice().reverse();
    const busqueda = document.getElementById('buscador-facturas').value.toLowerCase();
    const filtro = document.getElementById('filtro-estado-factura').value;

    const filtradas = facturas.filter(f => {
        const okBusq = f.id.toLowerCase().includes(busqueda) || String(f.mesa).includes(busqueda);
        const okEstado = !filtro || f.estado === filtro;
        return okBusq && okEstado;
    });

    const container = document.getElementById('lista-facturas');

    if (filtradas.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <i class="fas fa-file-invoice"></i>
            <p>No se encontraron facturas.</p>
        </div>`;
        return;
    }

    container.innerHTML = '';
    filtradas.forEach(f => {
        const estadoClass = f.estado === 'Pagada' ? 'estado-pagada' : f.estado === 'Anulada' ? 'estado-anulada' : 'estado-pendiente';
        const estadoIcon = f.estado === 'Pagada' ? 'fa-check-circle' : f.estado === 'Anulada' ? 'fa-ban' : 'fa-clock';

        const card = document.createElement('div');
        card.className = 'factura-card';
        card.innerHTML = `
            <div class="factura-card-header">
                <span class="factura-code"><i class="fas fa-file-invoice"></i> ${f.id}</span>
                <span class="estado-badge ${estadoClass}"><i class="fas ${estadoIcon}"></i> ${f.estado}</span>
                <span class="factura-total">${fmt(f.total)}</span>
            </div>
            <div class="factura-info">
                <span><i class="fas fa-table"></i> Mesa ${f.mesa}</span>
                <span><i class="fas fa-clock"></i> ${f.fechaHora}</span>
                <span><i class="fas fa-wallet"></i> ${f.metodoPago}</span>
                <span><i class="fas fa-receipt"></i> ${(f.codigosPedidos || []).length} pedido(s)</span>
            </div>
            <div class="factura-actions">
                <button class="btn-secondary btn-sm" onclick="verDetalleFactura('${f.id}')">
                    <i class="fas fa-eye"></i> Ver Ticket
                </button>
                ${f.estado !== 'Anulada' ? `
                    <button class="btn-danger btn-sm" onclick="iniciarAnulacion('${f.id}')">
                        <i class="fas fa-ban"></i> Anular
                    </button>` : `
                    <span style="font-size:0.75rem;color:#555;padding:0.3rem 0.5rem;">
                        Motivo: ${f.motivoAnulacion || '—'}
                    </span>`}
            </div>
        `;
        container.appendChild(card);
    });
}

document.getElementById('buscador-facturas').addEventListener('input', renderFacturas);
document.getElementById('filtro-estado-factura').addEventListener('change', renderFacturas);

window.verDetalleFactura = function (id) {
    const f = getLS('facturas_maffia').find(x => x.id === id);
    if (f) mostrarTicket(f);
};

// ============================================================
// ANULAR FACTURA
// ============================================================
window.iniciarAnulacion = function (id) {
    facturaEnAnulacion = id;
    document.getElementById('input-motivo-anulacion').value = '';
    document.getElementById('error-motivo-anulacion').textContent = '';
    document.getElementById('modal-anular').classList.remove('hidden');
};

document.getElementById('btn-cancelar-anulacion').addEventListener('click', () => {
    facturaEnAnulacion = null;
    document.getElementById('modal-anular').classList.add('hidden');
});

document.getElementById('btn-confirmar-anulacion').addEventListener('click', () => {
    const motivo = document.getElementById('input-motivo-anulacion').value.trim();
    if (motivo.length < 10) {
        showError('error-motivo-anulacion', 'El motivo debe tener al menos 10 caracteres.');
        return;
    }

    const facturas = getLS('facturas_maffia');
    const idx = facturas.findIndex(f => f.id === facturaEnAnulacion);
    if (idx === -1) return;

    facturas[idx].estado = 'Anulada';
    facturas[idx].motivoAnulacion = motivo;
    facturas[idx].fechaAnulacion = getFechaHora();
    setLS('facturas_maffia', facturas);

    // Revertir pedidos a 'entregado' para poder re-facturar
    const todosPedidos = getLS('pedidos_maffia');
    (facturas[idx].codigosPedidos || []).forEach(codigo => {
        const p = todosPedidos.find(pd => pd.codigo === codigo);
        if (p) p.estado = 'entregado';
    });
    setLS('pedidos_maffia', todosPedidos);

    document.getElementById('modal-anular').classList.add('hidden');
    facturaEnAnulacion = null;
    showToast('Factura anulada. Los pedidos volvieron a "Entregado".', 'success');
    renderFacturas();
});

document.getElementById('modal-anular').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
});

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('pedidos_maffia')) setLS('pedidos_maffia', []);
    if (!localStorage.getItem('facturas_maffia')) setLS('facturas_maffia', []);
});