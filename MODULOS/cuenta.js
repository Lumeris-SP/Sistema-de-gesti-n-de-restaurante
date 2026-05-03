/* ===========================
   CUENTA.JS - Módulo Facturación
   MAFFIA Restaurante Oriental
   =========================== */

// ============================================================
// UTILIDADES GENERALES
// ============================================================

function getLS(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

function setLS(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generarCodigoFactura() {
    const facturas = getLS('facturas');
    const num = facturas.length + 1;
    return 'FAC' + String(num).padStart(3, '0');
}

function formatMoney(val) {
    return 'S/ ' + parseFloat(val || 0).toFixed(2);
}

function getFechaHora() {
    const now = new Date();
    return now.toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

// ── NUEVO: formatea un campo fecha (ISO string o Date) al formato peruano ──
function formatFecha(fecha) {
    if (!fecha) return '—';
    try {
        return new Date(fecha).toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    } catch {
        return '—';
    }
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
    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) el.textContent = msg;
}

// ============================================================
// ESTADO GLOBAL DEL MÓDULO
// ============================================================

let mesaActual = null;
let pedidosSeleccionados = [];
let facturaEnEdicion = null;

// ============================================================
// TABS
// ============================================================

document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
        btn.classList.add('active');
        const tabId = 'tab-' + btn.dataset.tab;
        document.getElementById(tabId).classList.remove('hidden');
        if (btn.dataset.tab === 'cuentas-guardadas') renderFacturas();
    });
});

// ============================================================
// PASO 1 - BUSCAR MESA
// ============================================================

document.getElementById('btn-buscar-mesa').addEventListener('click', buscarMesa);
document.getElementById('input-mesa').addEventListener('keydown', e => {
    if (e.key === 'Enter') buscarMesa();
});

function buscarMesa() {
    clearErrors();
    const inputMesa = document.getElementById('input-mesa');
    const mesa = parseInt(inputMesa.value);

    if (!inputMesa.value.trim()) {
        showError('error-mesa', 'Ingrese un número de mesa.');
        return;
    }
    if (isNaN(mesa) || mesa < 1 || mesa > 50) {
        showError('error-mesa', 'El número de mesa debe estar entre 1 y 50.');
        return;
    }

    const pedidos = getLS('pedidos');

    // ── CORRECCIÓN: aceptar 'Entregado' (viene de pedidos.js estado 'listo')
    //    y también 'Listo' por si cocina.js lo marca directamente
    const pedidosMesa = pedidos.filter(p =>
        parseInt(p.mesa) === mesa &&
        (p.estado || '').toLowerCase() === 'entregado'
    );

    // Verificar que no hayan sido ya facturados
    const facturas = getLS('facturas');
    const pedidosYaFacturados = new Set();
    facturas.forEach(f => {
        if (f.estado !== 'Anulada') {
            (f.pedidosIds || []).forEach(id => pedidosYaFacturados.add(id));
        }
    });

    // Usar p.id o p.codigo (pedidos.js guarda ambos)
    const pedidosDisponibles = pedidosMesa.filter(p =>
        !pedidosYaFacturados.has(p.id) && !pedidosYaFacturados.has(p.codigo)
    );

    if (pedidosDisponibles.length === 0) {
        showError('error-mesa',
            pedidosMesa.length > 0
                ? 'Todos los pedidos de esta mesa ya fueron facturados.'
                : 'No hay pedidos entregados para esta mesa.'
        );
        document.getElementById('paso-pedidos').classList.add('hidden');
        document.getElementById('paso-pago').classList.add('hidden');
        return;
    }

    mesaActual = mesa;
    pedidosSeleccionados = [];
    renderPedidosMesa(pedidosDisponibles);
    document.getElementById('paso-pedidos').classList.remove('hidden');
    document.getElementById('paso-pago').classList.add('hidden');
    document.getElementById('label-mesa-seleccionada').textContent = 'Mesa #' + mesa;
}

// ============================================================
// PASO 2 - MOSTRAR PEDIDOS DE LA MESA
// ============================================================

function renderPedidosMesa(pedidos) {
    const container = document.getElementById('lista-pedidos-mesa');
    container.innerHTML = '';

    if (pedidos.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <i class="fas fa-clipboard"></i>
            <p>No hay pedidos entregados disponibles.</p>
        </div>`;
        return;
    }

    pedidos.forEach(pedido => {
        const card = document.createElement('div');
        card.className = 'pedido-item-card';

        // ── CORRECCIÓN: normalizar platos desde cualquier formato ──────────
        // pedidos.js guarda p.platos con {nombre, cantidad, precioUnitario, subtotal}
        // pero también puede venir en p.items con {nombre, precio, modificaciones}
        const platosNormalizados = normalizarPlatos(pedido);

        const platos = platosNormalizados.map(p => `
            <tr>
                <td>${p.nombre}</td>
                <td class="td-cant">${p.cantidad}</td>
                <td class="td-precio">${formatMoney(p.precioUnitario)}</td>
                <td class="td-subtotal">${formatMoney(p.subtotal)}</td>
                ${p.observaciones && p.observaciones.length > 0 
                    ? `<td style="font-size:0.75rem;color:var(--text-muted);font-style:italic">
                        ${p.observaciones.map(o => o.texto).join(', ')}
                    </td>` 
                    : '<td></td>'}
            </tr>
        `).join('');

        // ── CORRECCIÓN: usar fecha si fechaHora no existe ──────────────────
        const fechaMostrar = pedido.fechaHora || formatFecha(pedido.fecha);

        card.innerHTML = `
            <div class="pedido-item-header">
                <span class="pedido-code">
                    <i class="fas fa-hashtag"></i> ${pedido.id || pedido.codigo}
                </span>
                <span class="pedido-meta">
                    <i class="fas fa-user"></i> ${pedido.mozo} &nbsp;|&nbsp;
                    <i class="fas fa-clock"></i> ${fechaMostrar}
                </span>
                <span class="prioridad-${(pedido.prioridad || 'normal').toLowerCase()}">
                    <i class="fas fa-flag"></i> ${pedido.prioridad || 'Normal'}
                </span>
            </div>
            <table class="pedido-platos-table">
                <thead>
                    <tr>
                        <th>Plato</th>
                        <th style="text-align:center">Cant.</th>
                        <th style="text-align:right">P. Unit.</th>
                        <th style="text-align:right">Subtotal</th>
                        <th>Obs.</th>
                    </tr>
                </thead>
                <tbody>${platos}</tbody>
            </table>
        `;

        container.appendChild(card);
    });

    // Guardar referencia con platos normalizados y armar paso 3
    pedidosSeleccionados = pedidos.map(p => ({
        ...p,
        platos: normalizarPlatos(p),
        // Asegurar que id siempre exista
        id: p.id || p.codigo,
    }));

    armarResumen();
    document.getElementById('paso-pago').classList.remove('hidden');
}

// ── NUEVO: normaliza el array de platos sin importar el formato de origen ──
function normalizarPlatos(pedido) {
    // Preferir p.platos (formato completo de pedidos.js)
    if (Array.isArray(pedido.platos) && pedido.platos.length > 0) {
        return pedido.platos.map(p => ({
            nombre:         p.nombre,
            cantidad:       parseInt(p.cantidad) || 1,
            precioUnitario: parseFloat(p.precioUnitario) || parseFloat(p.precio) || 0,
            subtotal:       parseFloat(p.subtotal) || parseFloat(p.precio) || 0,
            observacion:    p.observaciones
                                ? p.observaciones.map(o => o.texto || o).join(', ')
                                : (p.observacion || p.modificaciones || ''),
        }));
    }

    // Fallback: p.items (formato reducido)
    if (Array.isArray(pedido.items) && pedido.items.length > 0) {
        return pedido.items.map(item => ({
            nombre:         item.nombre,
            cantidad:       parseInt(item.cantidad) || 1,
            precioUnitario: parseFloat(item.precioUnitario) || parseFloat(item.precio) || 0,
            subtotal:       parseFloat(item.subtotal) || parseFloat(item.precio) || 0,
            observacion:    item.modificaciones || '',
        }));
    }

    return [];
}

// ============================================================
// PASO 3 - RESUMEN Y CÁLCULOS
// ============================================================

function armarResumen() {
    const tablaContainer = document.getElementById('tabla-resumen-items');
    tablaContainer.innerHTML = '';

    if (pedidosSeleccionados.length === 0) return;

    // Agrupar todos los platos de todos los pedidos
    const itemsAgrupados = {};
    pedidosSeleccionados.forEach(pedido => {
        (pedido.platos || []).forEach(p => {
            const key = p.nombre;
            if (itemsAgrupados[key]) {
                itemsAgrupados[key].cantidad += parseInt(p.cantidad);
                itemsAgrupados[key].subtotal  += parseFloat(p.subtotal);
            } else {
                itemsAgrupados[key] = {
                    nombre:         p.nombre,
                    cantidad:       parseInt(p.cantidad),
                    precioUnitario: parseFloat(p.precioUnitario),
                    subtotal:       parseFloat(p.subtotal)
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

    Object.values(itemsAgrupados).forEach(item => {
        const row = document.createElement('div');
        row.className = 'resumen-item-row';
        row.innerHTML = `
            <span class="ri-nombre">${item.nombre}</span>
            <span class="ri-cant">x${item.cantidad}</span>
            <span class="ri-precio">${formatMoney(item.precioUnitario)}</span>
            <span class="ri-subtotal">${formatMoney(item.subtotal)}</span>
        `;
        wrapper.appendChild(row);
    });

    tablaContainer.appendChild(wrapper);
    recalcular();
}

function recalcular() {
    let subtotal = 0;
    pedidosSeleccionados.forEach(pedido => {
        (pedido.platos || []).forEach(p => {
            subtotal += parseFloat(p.subtotal || 0);
        });
    });

    // Descuento
    let descuento = 0;
    if (document.getElementById('chk-descuento').checked) {
        const tipo  = document.getElementById('tipo-descuento').value;
        const valor = parseFloat(document.getElementById('input-descuento').value) || 0;
        if (tipo === 'porcentaje') {
            descuento = (subtotal * valor) / 100;
        } else {
            descuento = valor;
        }
        if (descuento > subtotal) descuento = subtotal;
        if (descuento < 0)        descuento = 0;
    }

    // IGV
    let igv = 0;
    const conIgv      = document.getElementById('chk-igv').checked;
    const baseCalculo = subtotal - descuento;
    if (conIgv) igv = baseCalculo * 0.18;

    const total = baseCalculo + igv;

    document.getElementById('val-subtotal').textContent  = formatMoney(subtotal);
    document.getElementById('val-descuento').textContent = '- ' + formatMoney(descuento);
    document.getElementById('val-igv').textContent       = formatMoney(igv);
    document.getElementById('val-total').textContent     = formatMoney(total);

    calcularVuelto();
}

// ============================================================
// DESCUENTO
// ============================================================

document.getElementById('chk-descuento').addEventListener('change', function () {
    const form = document.getElementById('descuento-form');
    form.classList.toggle('hidden', !this.checked);
    if (!this.checked) {
        document.getElementById('input-descuento').value          = '';
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

document.querySelectorAll('input[name="metodo-pago"]').forEach(radio => {
    radio.addEventListener('change', function () {
        const efectivoFields = document.getElementById('efectivo-fields');
        efectivoFields.classList.toggle('hidden', this.value !== 'Efectivo');
        if (this.value !== 'Efectivo') {
            document.getElementById('input-monto-recibido').value = '';
            document.getElementById('display-vuelto').value       = '';
        }
    });
});

document.getElementById('input-monto-recibido').addEventListener('input', calcularVuelto);

function calcularVuelto() {
    const total   = parseMoney(document.getElementById('val-total').textContent);
    const monto   = parseFloat(document.getElementById('input-monto-recibido').value) || 0;
    const vueltoEl = document.getElementById('display-vuelto');
    if (monto >= total && total > 0) {
        vueltoEl.value       = formatMoney(monto - total);
        vueltoEl.style.color = 'var(--success)';
    } else if (monto > 0) {
        vueltoEl.value       = '⚠ Insuficiente';
        vueltoEl.style.color = 'var(--danger)';
    } else {
        vueltoEl.value = '';
    }
}

function parseMoney(str) {
    return parseFloat((str || '').replace('S/ ', '').replace(',', '.')) || 0;
}

// ============================================================
// VALIDAR Y CONFIRMAR PAGO
// ============================================================

document.getElementById('btn-confirmar-pago').addEventListener('click', confirmarPago);

function confirmarPago() {
    clearErrors();
    let valido = true;

    // Validar descuento
    if (document.getElementById('chk-descuento').checked) {
        const tipo      = document.getElementById('tipo-descuento').value;
        const valorDesc = parseFloat(document.getElementById('input-descuento').value);
        const justDesc  = document.getElementById('input-justificacion-desc').value.trim();
        const subtotal  = parseMoney(document.getElementById('val-subtotal').textContent);

        if (isNaN(valorDesc) || valorDesc < 0) {
            showError('error-descuento', 'El descuento no puede ser negativo.');
            valido = false;
        } else if (tipo === 'monto' && valorDesc > subtotal) {
            showError('error-descuento', 'El descuento no puede ser mayor al subtotal.');
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

    // Validar método de pago
    const metodoPago = document.querySelector('input[name="metodo-pago"]:checked');
    if (!metodoPago) {
        showError('error-metodo-pago', 'Seleccione un método de pago.');
        valido = false;
    }

    // Validar efectivo
    if (metodoPago && metodoPago.value === 'Efectivo') {
        const total = parseMoney(document.getElementById('val-total').textContent);
        const monto = parseFloat(document.getElementById('input-monto-recibido').value);
        if (isNaN(monto) || monto < 0) {
            showError('error-monto-recibido', 'Ingrese el monto recibido.');
            valido = false;
        } else if (monto < total) {
            showError('error-monto-recibido', 'El monto recibido es menor al total.');
            valido = false;
        }
    }

    if (!valido) return;

    // Construir objeto factura
    const subtotal    = parseMoney(document.getElementById('val-subtotal').textContent);
    const descuentoStr = document.getElementById('val-descuento').textContent;
    const descuento   = parseMoney(descuentoStr.replace('- ', ''));
    const igv         = parseMoney(document.getElementById('val-igv').textContent);
    const total       = parseMoney(document.getElementById('val-total').textContent);

    const factura = {
        id:          generarCodigoFactura(),
        mesa:        mesaActual,
        // ── CORRECCIÓN: usar id o codigo según lo que exista ──
        pedidosIds:  pedidosSeleccionados.map(p => p.id || p.codigo),
        pedidos:     pedidosSeleccionados,
        subtotal,
        descuento,
        justificacionDescuento: document.getElementById('chk-descuento').checked
            ? document.getElementById('input-justificacion-desc').value.trim()
            : '',
        conIgv:      document.getElementById('chk-igv').checked,
        igv,
        total,
        metodoPago:  metodoPago.value,
        montoRecibido: metodoPago.value === 'Efectivo'
            ? parseFloat(document.getElementById('input-monto-recibido').value) || 0
            : null,
        vuelto: metodoPago.value === 'Efectivo'
            ? Math.max(0, (parseFloat(document.getElementById('input-monto-recibido').value) || 0) - total)
            : null,
        estado:    'Pagada',
        fechaHora: getFechaHora()
    };

    // Guardar factura
    const facturas = getLS('facturas');
    facturas.push(factura);
    setLS('facturas', facturas);

    // ── CORRECCIÓN: marcar pedidos como Facturado usando id o codigo ──
    const pedidos = getLS('pedidos');
    const idsFacturados = new Set(pedidosSeleccionados.map(ps => ps.id || ps.codigo));
    pedidos.forEach(p => {
        if (idsFacturados.has(p.id) || idsFacturados.has(p.codigo)) {
            p.estado = 'Facturado';
        }
    });
    setLS('pedidos', pedidos);

    showToast('¡Pago confirmado! Factura ' + factura.id + ' generada.', 'success');
    mostrarTicket(factura);
    resetFormulario();
}

// ============================================================
// RESET FORMULARIO
// ============================================================

function resetFormulario() {
    mesaActual          = null;
    pedidosSeleccionados = [];
    document.getElementById('input-mesa').value               = '';
    document.getElementById('paso-pedidos').classList.add('hidden');
    document.getElementById('paso-pago').classList.add('hidden');
    document.getElementById('lista-pedidos-mesa').innerHTML   = '';
    document.getElementById('tabla-resumen-items').innerHTML  = '';
    document.getElementById('chk-descuento').checked          = false;
    document.getElementById('descuento-form').classList.add('hidden');
    document.getElementById('input-descuento').value          = '';
    document.getElementById('input-justificacion-desc').value = '';
    document.getElementById('chk-igv').checked                = true;
    document.querySelectorAll('input[name="metodo-pago"]').forEach(r => r.checked = false);
    document.getElementById('efectivo-fields').classList.add('hidden');
    document.getElementById('input-monto-recibido').value     = '';
    document.getElementById('display-vuelto').value           = '';
    document.getElementById('val-subtotal').textContent       = 'S/ 0.00';
    document.getElementById('val-descuento').textContent      = '- S/ 0.00';
    document.getElementById('val-igv').textContent            = 'S/ 0.00';
    document.getElementById('val-total').textContent          = 'S/ 0.00';
    clearErrors();
}

document.getElementById('btn-cancelar-cuenta').addEventListener('click', resetFormulario);

// ============================================================
// TICKET DE PAGO
// ============================================================

function mostrarTicket(factura) {
    const contenido = document.getElementById('ticket-contenido');

    const itemsHTML = factura.pedidos.flatMap(p =>
        (p.platos || []).map(pl => `
            <div class="ticket-item-row">
                <span>${pl.nombre} x${pl.cantidad}</span>
                <span>${formatMoney(pl.subtotal)}</span>
            </div>
        `)
    ).join('');

    contenido.innerHTML = `
        <div class="ticket-row">
            <span><i class="fas fa-hashtag"></i> Factura</span>
            <span><b>${factura.id}</b></span>
        </div>
        <div class="ticket-row">
            <span><i class="fas fa-table"></i> Mesa</span>
            <span>${factura.mesa}</span>
        </div>
        <div class="ticket-row">
            <span><i class="fas fa-clock"></i> Fecha</span>
            <span>${factura.fechaHora}</span>
        </div>
        <div class="ticket-line"></div>
        ${itemsHTML}
        <div class="ticket-line"></div>
        <div class="ticket-row">
            <span>Subtotal</span>
            <span>${formatMoney(factura.subtotal)}</span>
        </div>
        ${factura.descuento > 0 ? `
        <div class="ticket-row" style="color:var(--danger)">
            <span>Descuento</span>
            <span>- ${formatMoney(factura.descuento)}</span>
        </div>` : ''}
        ${factura.conIgv ? `
        <div class="ticket-row">
            <span>IGV (18%)</span>
            <span>${formatMoney(factura.igv)}</span>
        </div>` : ''}
        <div class="ticket-row total-ticket">
            <span>TOTAL</span>
            <span>${formatMoney(factura.total)}</span>
        </div>
        <div class="ticket-line"></div>
        <div class="ticket-row">
            <span>Método de pago</span>
            <span>${factura.metodoPago}</span>
        </div>
        ${factura.metodoPago === 'Efectivo' ? `
        <div class="ticket-row">
            <span>Monto recibido</span>
            <span>${formatMoney(factura.montoRecibido)}</span>
        </div>
        <div class="ticket-row" style="color:var(--success)">
            <span>Vuelto</span>
            <span>${formatMoney(factura.vuelto)}</span>
        </div>` : ''}
    `;

    document.getElementById('modal-ticket').classList.remove('hidden');
}

document.getElementById('btn-cerrar-ticket').addEventListener('click', () => {
    document.getElementById('modal-ticket').classList.add('hidden');
});

document.getElementById('btn-imprimir-ticket').addEventListener('click', () => {
    window.print();
});

// ============================================================
// LISTA DE FACTURAS GUARDADAS
// ============================================================

function renderFacturas() {
    const facturas    = getLS('facturas');
    const container   = document.getElementById('lista-facturas');
    const busqueda    = document.getElementById('buscador-facturas').value.toLowerCase();
    const filtroEstado = document.getElementById('filtro-estado-factura').value;

    let filtradas = facturas.filter(f => {
        const coincideBusqueda =
            f.id.toLowerCase().includes(busqueda) ||
            String(f.mesa).includes(busqueda);
        const coincideEstado = !filtroEstado || f.estado === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    filtradas = filtradas.reverse();

    if (filtradas.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <i class="fas fa-file-invoice"></i>
            <p>No se encontraron facturas.</p>
        </div>`;
        return;
    }

    container.innerHTML = '';

    filtradas.forEach(f => {
        const card = document.createElement('div');
        card.className = 'factura-card';

        const estadoClass =
            f.estado === 'Pagada'  ? 'estado-pagada'  :
            f.estado === 'Anulada' ? 'estado-anulada' : 'estado-pendiente';

        const estadoIcon =
            f.estado === 'Pagada'  ? 'fa-check-circle' :
            f.estado === 'Anulada' ? 'fa-ban'          : 'fa-clock';

        card.innerHTML = `
            <div class="factura-card-header">
                <span class="factura-code"><i class="fas fa-file-invoice"></i> ${f.id}</span>
                <span class="estado-badge ${estadoClass}">
                    <i class="fas ${estadoIcon}"></i> ${f.estado}
                </span>
                <span class="factura-total">${formatMoney(f.total)}</span>
            </div>
            <div class="factura-info">
                <span><i class="fas fa-table"></i> Mesa ${f.mesa}</span>
                <span><i class="fas fa-clock"></i> ${f.fechaHora}</span>
                <span><i class="fas fa-wallet"></i> ${f.metodoPago}</span>
                <span><i class="fas fa-receipt"></i> ${(f.pedidosIds || []).length} pedido(s)</span>
            </div>
            <div class="factura-actions">
                <button class="btn-secondary btn-sm" onclick="verDetalleFactura('${f.id}')">
                    <i class="fas fa-eye"></i> Ver Detalle
                </button>
                ${f.estado !== 'Anulada' ? `
                <button class="btn-danger btn-sm" onclick="iniciarAnulacion('${f.id}')">
                    <i class="fas fa-ban"></i> Anular
                </button>` : `
                <span style="font-size:0.75rem;color:var(--text-dim);padding:0.35rem 0.5rem">
                    <i class="fas fa-info-circle"></i> ${f.motivoAnulacion ? 'Motivo: ' + f.motivoAnulacion : 'Anulada'}
                </span>`}
            </div>
        `;

        container.appendChild(card);
    });
}

document.getElementById('buscador-facturas').addEventListener('input', renderFacturas);
document.getElementById('filtro-estado-factura').addEventListener('change', renderFacturas);

// ============================================================
// VER DETALLE DE FACTURA
// ============================================================

function verDetalleFactura(id) {
    const facturas = getLS('facturas');
    const f = facturas.find(fa => fa.id === id);
    if (!f) return;
    mostrarTicket(f);
}

window.verDetalleFactura = verDetalleFactura;

// ============================================================
// ANULAR FACTURA
// ============================================================

function iniciarAnulacion(id) {
    facturaEnEdicion = id;
    document.getElementById('input-motivo-anulacion').value  = '';
    document.getElementById('error-motivo-anulacion').textContent = '';
    document.getElementById('modal-anular').classList.remove('hidden');
}

window.iniciarAnulacion = iniciarAnulacion;

document.getElementById('btn-cancelar-anulacion').addEventListener('click', () => {
    facturaEnEdicion = null;
    document.getElementById('modal-anular').classList.add('hidden');
});

document.getElementById('btn-confirmar-anulacion').addEventListener('click', () => {
    const motivo = document.getElementById('input-motivo-anulacion').value.trim();

    if (motivo.length < 10) {
        showError('error-motivo-anulacion', 'El motivo debe tener al menos 10 caracteres.');
        return;
    }

    const facturas = getLS('facturas');
    const idx = facturas.findIndex(f => f.id === facturaEnEdicion);
    if (idx === -1) return;

    if (facturas[idx].estado === 'Anulada') {
        showToast('Esta factura ya está anulada.', 'error');
        document.getElementById('modal-anular').classList.add('hidden');
        return;
    }

    facturas[idx].estado          = 'Anulada';
    facturas[idx].motivoAnulacion = motivo;
    facturas[idx].fechaAnulacion  = getFechaHora();
    setLS('facturas', facturas);

    // ── CORRECCIÓN: revertir pedidos usando id o codigo ──
    const pedidos = getLS('pedidos');
    const idsAnulados = new Set(facturas[idx].pedidosIds || []);
    pedidos.forEach(p => {
        if (idsAnulados.has(p.id) || idsAnulados.has(p.codigo)) {
            p.estado      = 'Entregado';
            p.estadoCocina = 'Listo';
        }
    });
    setLS('pedidos', pedidos);

    document.getElementById('modal-anular').classList.add('hidden');
    facturaEnEdicion = null;

    showToast('Factura anulada correctamente.', 'success');
    renderFacturas();
});

// Cerrar modales al hacer clic fuera
document.getElementById('modal-ticket').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
});
document.getElementById('modal-anular').addEventListener('click', function (e) {
    if (e.target === this) this.classList.add('hidden');
});

// ============================================================
// INICIALIZACIÓN
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    if (!localStorage.getItem('pedidos'))  setLS('pedidos',  []);
    if (!localStorage.getItem('platos'))   setLS('platos',   []);
    if (!localStorage.getItem('facturas')) setLS('facturas', []);
});