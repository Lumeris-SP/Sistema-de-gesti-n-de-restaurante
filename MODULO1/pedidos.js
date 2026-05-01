// ============================================================
// DATOS
// ============================================================
const PLATOS_DB = [
    { id: 1, nombre: 'Arroz Chaufa Especial', precio: 22.00, activo: true },
    { id: 2, nombre: 'Tallarín Saltado de Res', precio: 26.00, activo: true },
    { id: 3, nombre: 'Sopa Wantán', precio: 18.00, activo: true },
    { id: 4, nombre: 'Pollo al Vapor con Jengibre', precio: 28.00, activo: true },
    { id: 5, nombre: 'Rollitos Primavera (6 u.)', precio: 14.00, activo: true },
    { id: 6, nombre: 'Kion Crocante', precio: 12.00, activo: false }, // INACTIVO
    { id: 7, nombre: 'Pato Pekinés', precio: 38.00, activo: true },
    { id: 8, nombre: 'Dim Sum Variado', precio: 20.00, activo: true },
];

const ADICIONALES_DB = [
    { nombre: 'Porción extra de arroz', precio: 3.00 },
    { nombre: 'Salsa de soya extra', precio: 1.50 },
    { nombre: 'Extra de vegetales', precio: 4.00 },
    { nombre: 'Sin sal', precio: 0 },
    { nombre: 'Sin glutamato', precio: 0 },
    { nombre: 'Extra picante', precio: 0 },
    { nombre: 'Sin cebolla', precio: 0 },
    { nombre: 'Sin ajo', precio: 0 },
    { nombre: 'Porción extra de carne', precio: 6.00 },
];

let pedidos = [];
let contadorPedido = 1;
let prioridadSeleccionada = 'normal';

// ============================================================
// INIT
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    actualizarCodigo();
    actualizarFechaHora();
    renderizarPlatos();
    renderizarPedidos();

    document.getElementById('pedidoForm').addEventListener('submit', crearPedido);

    // Bloquear teclas no numéricas (la 'e', '+', '-', '.' son válidas en type=number por defecto)
    document.getElementById('mesa').addEventListener('keydown', function(e) {
        if (['e','E','+','-','.'].includes(e.key)) e.preventDefault();
    });

    // Validación live mesa
    document.getElementById('mesa').addEventListener('input', function() {
        const val = parseInt(this.value);
        const err = document.getElementById('mesaError');
        if (this.value === '' || isNaN(val)) {
            err.textContent = '';
            this.classList.remove('error');
        } else if (val < 1 || val > 50) {
            err.textContent = 'El número de mesa debe estar entre 1 y 50';
            this.classList.add('error');
        } else {
            err.textContent = '';
            this.classList.remove('error');
        }
    });

    // Validación live mozo
    document.getElementById('mozo').addEventListener('input', function() {
        validarMozo(false);
    });
});

function actualizarCodigo() {
    const codigo = 'PED' + String(contadorPedido).padStart(3, '0');
    document.getElementById('codigoPedido').textContent = codigo;
}

function actualizarFechaHora() {
    const ahora = new Date();
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    document.getElementById('fechaHora').textContent = ahora.toLocaleString('es-PE', opciones);
    // Actualizar cada segundo
    setInterval(() => {
        const n = new Date();
        document.getElementById('fechaHora').textContent = n.toLocaleString('es-PE', opciones);
    }, 1000);
}

// ============================================================
// PLATOS
// ============================================================
function renderizarPlatos() {
    const contenedor = document.getElementById('platosDisponibles');
    contenedor.innerHTML = '';
    const platosActivos = PLATOS_DB.filter(p => p.activo);
    platosActivos.forEach(plato => {
        const div = document.createElement('div');
        div.className = 'plato-item';
        div.id = `plato-item-${plato.id}`;
        div.innerHTML = `
            <div class="plato-header" onclick="togglePlato(${plato.id}, false)">
                <input class="plato-check" type="checkbox" id="chk-${plato.id}" onchange="togglePlato(${plato.id}, true)" onclick="event.stopPropagation()">
                <span class="plato-name">${plato.nombre}</span>
                <span class="plato-precio">S/ ${plato.precio.toFixed(2)}</span>
            </div>
            <div class="plato-controls" id="ctrl-${plato.id}">
                <div class="plato-qty-row">
                    <button type="button" class="qty-btn" onclick="cambiarQty(${plato.id}, -1)"><i class="fas fa-minus"></i></button>
                    <input class="qty-input" type="text" id="qty-${plato.id}" value="1" oninput="validarQty(${plato.id})" inputmode="numeric">
                    <button type="button" class="qty-btn" onclick="cambiarQty(${plato.id}, 1)"><i class="fas fa-plus"></i></button>
                    <span class="qty-subtotal">Subtotal: <span id="sub-${plato.id}">S/ ${plato.precio.toFixed(2)}</span></span>
                </div>
                <div class="obs-list" id="obs-list-${plato.id}"></div>
                <button type="button" class="btn-add-obs-main" onclick="agregarObservacion(${plato.id})">
                    <i class="fas fa-plus"></i> Adicionar observación especial
                </button>
            </div>
        `;
        contenedor.appendChild(div);
    });
}

function togglePlato(platoId, fromCheckbox) {
    const chk = document.getElementById(`chk-${platoId}`);
    const ctrl = document.getElementById(`ctrl-${platoId}`);
    const item = document.getElementById(`plato-item-${platoId}`);
    // If called from the row click (not the checkbox itself), flip the checkbox
    if (!fromCheckbox) chk.checked = !chk.checked;
    if (chk.checked) {
        ctrl.classList.add('visible');
        item.classList.add('selected');
        calcularSubtotal(platoId);
    } else {
        ctrl.classList.remove('visible');
        item.classList.remove('selected');
    }
    calcularTotal();
    document.getElementById('platosError').textContent = '';
}

function cambiarQty(platoId, delta) {
    const input = document.getElementById(`qty-${platoId}`);
    let val = parseInt(input.value) || 1;
    val = Math.max(1, val + delta);
    input.value = val;
    calcularSubtotal(platoId);
    calcularTotal();
}

function validarQty(platoId) {
    const input = document.getElementById(`qty-${platoId}`);
    // Eliminar letras
    input.value = input.value.replace(/\D/g, '');
    if (parseInt(input.value) < 1 || input.value === '') input.value = '1';
    calcularSubtotal(platoId);
    calcularTotal();
}

function calcularSubtotal(platoId) {
    const plato = PLATOS_DB.find(p => p.id === platoId);
    const qty = parseInt(document.getElementById(`qty-${platoId}`)?.value) || 1;
    const extraObs = calcularExtrasObs(platoId);
    const sub = (plato.precio + extraObs) * qty;
    const el = document.getElementById(`sub-${platoId}`);
    if (el) el.textContent = `S/ ${sub.toFixed(2)}`;
}

function calcularExtrasObs(platoId) {
    const lista = document.getElementById(`obs-list-${platoId}`);
    if (!lista) return 0;
    let extra = 0;
    lista.querySelectorAll('.obs-select').forEach(sel => {
        const ad = ADICIONALES_DB.find(a => a.nombre === sel.value);
        if (ad) extra += ad.precio;
    });
    return extra;
}

function calcularTotal() {
    let total = 0;
    PLATOS_DB.filter(p => p.activo).forEach(plato => {
        const chk = document.getElementById(`chk-${plato.id}`);
        if (chk && chk.checked) {
            const qty = parseInt(document.getElementById(`qty-${plato.id}`)?.value) || 1;
            const extras = calcularExtrasObs(plato.id);
            total += (plato.precio + extras) * qty;
        }
    });
    document.getElementById('totalDisplay').textContent = `S/ ${total.toFixed(2)}`;
}

// ============================================================
// OBSERVACIONES POR PLATO
// ============================================================
function agregarObservacion(platoId) {
    const lista = document.getElementById(`obs-list-${platoId}`);
    const row = document.createElement('div');
    row.className = 'obs-row';

    const opciones = ADICIONALES_DB.map(a =>
        `<option value="${a.nombre}">${a.nombre}${a.precio > 0 ? ` (+S/ ${a.precio.toFixed(2)})` : ''}</option>`
    ).join('');

    row.innerHTML = `
        <select class="obs-select" onchange="onObsChange(this, ${platoId})">
            <option value="">-- Observación/Adicional --</option>
            ${opciones}
            <option value="__custom__">Otro (escribir)...</option>
        </select>
        <button type="button" class="btn-del-obs" onclick="eliminarObservacion(this, ${platoId})"><i class="fas fa-times"></i></button>
    `;
    lista.appendChild(row);
}

function onObsChange(sel, platoId) {
    const row = sel.parentElement;
    // Remover textarea previo si hay
    const prev = row.querySelector('.obs-custom');
    const prevCounter = row.querySelector('.obs-counter');
    if (prev) prev.remove();
    if (prevCounter) prevCounter.remove();
    const prevExtra = row.querySelector('.obs-extra-costo');
    if (prevExtra) prevExtra.remove();

    if (sel.value === '__custom__') {
        const ta = document.createElement('textarea');
        ta.className = 'obs-custom';
        ta.rows = 2;
        ta.maxLength = 150;
        ta.placeholder = 'Describe la observación...';
        const counter = document.createElement('div');
        counter.className = 'obs-counter';
        counter.textContent = '0/150';
        ta.oninput = () => {
            const len = ta.value.length;
            counter.textContent = `${len}/150`;
            counter.classList.toggle('warn', len > 130);
        };
        row.appendChild(ta);
        row.appendChild(counter);
    } else {
        const ad = ADICIONALES_DB.find(a => a.nombre === sel.value);
        if (ad && ad.precio > 0) {
            const badge = document.createElement('div');
            badge.className = 'obs-extra-costo';
            badge.innerHTML = `<i class="fas fa-plus-circle"></i> +S/ ${ad.precio.toFixed(2)} al subtotal`;
            row.appendChild(badge);
        }
    }
    calcularSubtotal(platoId);
    calcularTotal();
}

function eliminarObservacion(btn, platoId) {
    btn.parentElement.remove();
    calcularSubtotal(platoId);
    calcularTotal();
}

// ============================================================
// PRIORIDAD
// ============================================================
function setPrioridad(btn) {
    document.querySelectorAll('.prio-btn').forEach(b => {
        b.className = 'prio-btn';
    });
    const p = btn.dataset.prio;
    prioridadSeleccionada = p;
    if (p === 'normal') btn.classList.add('active-normal');
    if (p === 'alta') btn.classList.add('active-alta');
    if (p === 'urgente') btn.classList.add('active-urgente');

    const jBlock = document.getElementById('justificacionBlock');
    jBlock.classList.toggle('visible', p === 'urgente');
    document.getElementById('prioError').textContent = '';
}

// ============================================================
// VALIDACIONES
// ============================================================
function validarMozo(mostrarError = true) {
    const val = document.getElementById('mozo').value.trim();
    const err = document.getElementById('mozoError');
    if (!val) {
        if (mostrarError) { err.textContent = 'El nombre del mozo es obligatorio'; document.getElementById('mozo').classList.add('error'); }
        return false;
    }
    if (val.length < 3) {
        if (mostrarError) { err.textContent = 'Mínimo 3 caracteres'; document.getElementById('mozo').classList.add('error'); }
        return false;
    }
    if (/^\d+$/.test(val)) {
        if (mostrarError) { err.textContent = 'No puede ser solo números'; document.getElementById('mozo').classList.add('error'); }
        return false;
    }
    err.textContent = '';
    document.getElementById('mozo').classList.remove('error');
    return true;
}

function validarMesa() {
    const raw = document.getElementById('mesa').value.trim();
    const val = parseInt(raw);
    const err = document.getElementById('mesaError');
    if (!raw || isNaN(val) || val < 1 || val > 50) {
        err.textContent = 'Ingrese un número de mesa válido (1 – 50)';
        document.getElementById('mesa').classList.add('error');
        return false;
    }
    err.textContent = '';
    document.getElementById('mesa').classList.remove('error');
    return true;
}

function validarPlatos() {
    const seleccionados = PLATOS_DB.filter(p => p.activo && document.getElementById(`chk-${p.id}`)?.checked);
    if (seleccionados.length === 0) {
        document.getElementById('platosError').textContent = 'Seleccione al menos un plato';
        return false;
    }
    document.getElementById('platosError').textContent = '';
    return true;
}

function validarJustificacion() {
    if (prioridadSeleccionada !== 'urgente') return true;
    const sel = document.getElementById('justificacionSelect').value;
    const txt = document.getElementById('justificacionTexto').value.trim();
    const err = document.getElementById('justError');
    if (!sel) { err.textContent = 'Seleccione un motivo de urgencia'; return false; }
    if (txt.length < 10 && sel === 'Otro') { err.textContent = 'Detalle mínimo 10 caracteres'; return false; }
    err.textContent = '';
    return true;
}

// ============================================================
// CREAR PEDIDO
// ============================================================
function crearPedido(e) {
    e.preventDefault();
    const okMesa = validarMesa();
    const okMozo = validarMozo(true);
    const okPlatos = validarPlatos();
    const okJust = validarJustificacion();

    if (!okMesa || !okMozo || !okPlatos || !okJust) return;

    const mesa = parseInt(document.getElementById('mesa').value);
    const mozo = document.getElementById('mozo').value.trim();
    const cliente = document.getElementById('cliente').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();
    const ahora = new Date();

    // Recopilar platos seleccionados
    const platosSeleccionados = [];
    PLATOS_DB.filter(p => p.activo).forEach(plato => {
        const chk = document.getElementById(`chk-${plato.id}`);
        if (chk && chk.checked) {
            const qty = parseInt(document.getElementById(`qty-${plato.id}`)?.value) || 1;
            // Recopilar observaciones
            const obsList = document.getElementById(`obs-list-${plato.id}`);
            const obsData = [];
            obsList.querySelectorAll('.obs-row').forEach(row => {
                const sel = row.querySelector('.obs-select');
                const ta = row.querySelector('.obs-custom');
                let texto = '';
                if (sel.value === '__custom__' && ta) {
                    texto = ta.value.trim();
                } else {
                    texto = sel.value;
                }
                if (texto) {
                    const ad = ADICIONALES_DB.find(a => a.nombre === texto);
                    obsData.push({ texto, extra: ad ? ad.precio : 0 });
                }
            });
            const extras = obsData.reduce((s, o) => s + o.extra, 0);
            platosSeleccionados.push({
                id: plato.id,
                nombre: plato.nombre,
                precioUnitario: plato.precio,
                cantidad: qty,
                subtotal: (plato.precio + extras) * qty,
                observaciones: obsData,
            });
        }
    });

    const total = platosSeleccionados.reduce((s, p) => s + p.subtotal, 0);
    const justSel = document.getElementById('justificacionSelect').value;
    const justTxt = document.getElementById('justificacionTexto').value.trim();
    const justificacion = prioridadSeleccionada === 'urgente' ? (justSel === 'Otro' ? justTxt : justSel) : '';

    const pedido = {
        codigo: `PED${String(contadorPedido).padStart(3, '0')}`,
        mesa,
        mozo,
        cliente,
        fecha: ahora,
        platos: platosSeleccionados,
        observacionGeneral: observaciones,
        prioridad: prioridadSeleccionada,
        justificacion,
        estado: 'registrado',
        total,
    };

    pedidos.unshift(pedido);
    contadorPedido++;
    actualizarCodigo();
    renderizarPedidos();
    resetForm();
}

function resetForm() {
    document.getElementById('mesa').value = '';
    document.getElementById('mozo').value = '';
    document.getElementById('cliente').value = '';
    document.getElementById('observaciones').value = '';
    document.getElementById('justificacionSelect').value = '';
    document.getElementById('justificacionTexto').value = '';
    document.getElementById('justificacionBlock').classList.remove('visible');
    prioridadSeleccionada = 'normal';
    document.querySelectorAll('.prio-btn').forEach(b => b.className = 'prio-btn');
    document.querySelector('[data-prio="normal"]').classList.add('active-normal');
    renderizarPlatos();
    document.getElementById('totalDisplay').textContent = 'S/ 0.00';
}

// ============================================================
// RENDER PEDIDOS
// ============================================================
const ESTADOS_FLUJO = {
    registrado:   { label: 'Registrado',        class: 'estado-registrado',   siguiente: 'cocina' },
    cocina:       { label: 'Enviado a Cocina',   class: 'estado-cocina',       siguiente: 'preparacion' },
    preparacion:  { label: 'En Preparación',     class: 'estado-preparacion',  siguiente: 'listo' },
    listo:        { label: 'Listo para Servir',  class: 'estado-listo',        siguiente: 'entregado' },
    entregado:    { label: 'Entregado',          class: 'estado-entregado',    siguiente: null },
    cancelado:    { label: 'Cancelado',          class: 'estado-cancelado',    siguiente: null },
};

function renderizarPedidos() {
    const cont = document.getElementById('pedidosList');
    if (pedidos.length === 0) {
        cont.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard"></i>No hay pedidos activos</div>`;
        return;
    }

    // Detectar mesas con múltiples pedidos
    const mesaCount = {};
    pedidos.forEach(p => { if (p.estado !== 'cancelado' && p.estado !== 'entregado') mesaCount[p.mesa] = (mesaCount[p.mesa] || 0) + 1; });

    cont.innerHTML = pedidos.map((p, i) => {
        const est = ESTADOS_FLUJO[p.estado];
        const prio = p.prioridad;
        const prioTag = `<span class="prio-tag prio-${prio}">${prio.charAt(0).toUpperCase()+prio.slice(1)}</span>`;
        const multimesa = mesaCount[p.mesa] > 1
            ? `<span style="color:var(--yellow);font-size:10px;"><i class="fas fa-exclamation-circle"></i> ${mesaCount[p.mesa]} pedidos en esta mesa</span>`
            : '';
        const fecha = p.fecha.toLocaleString('es-PE', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });

        // Fila de info: Mesa · Mozo · Cliente (separados)
        const infoRow = `
            <div class="pc-info-row">
                <span class="pc-info-item"><span class="pc-info-label">Mesa</span> ${p.mesa}</span>
                <span class="pc-info-sep">·</span>
                <span class="pc-info-item"><span class="pc-info-label">Mozo</span> ${p.mozo}</span>
                ${p.cliente ? `<span class="pc-info-sep">·</span><span class="pc-info-item"><span class="pc-info-label">Cliente</span> ${p.cliente}</span>` : ''}
            </div>
            <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:3px;">
                <span style="font-size:11px;color:var(--text-muted);"><i class="fas fa-clock" style="margin-right:3px;"></i>${fecha}</span>
                ${multimesa}
            </div>
            ${p.justificacion ? `<div style="font-size:11px;color:var(--red);margin-top:4px;"><i class="fas fa-exclamation-triangle"></i> ${p.justificacion}</div>` : ''}
        `;

        // Platos con sus obs por plato
        const platosHtml = p.platos.map(pl => {
            const obsHtml = pl.observaciones.length > 0 ? `
                <div class="pc-plato-obs-block">
                    <span class="pc-obs-label">Obs. del plato:</span>
                    <div class="pc-obs-tags">
                        ${pl.observaciones.map(o => `<span class="pc-obs-tag">${o.texto}${o.extra > 0 ? ` <strong>+S/ ${o.extra.toFixed(2)}</strong>` : ''}</span>`).join('')}
                    </div>
                </div>` : '';
            return `
                <div class="pc-plato-item">
                    <div class="pc-plato-top">
                        <span class="pc-plato-nombre">${pl.nombre}</span>
                        <span class="pc-plato-detalle">x${pl.cantidad} · S/ ${pl.subtotal.toFixed(2)}</span>
                    </div>
                    ${obsHtml}
                </div>`;
        }).join('');

        // Nota general
        const notaHtml = p.observacionGeneral ? `
            <div class="pc-section">
                <div class="pc-section-title"><i class="fas fa-comment"></i> Nota general del pedido</div>
                <div class="pc-nota-general">${p.observacionGeneral}</div>
            </div>` : '';

        const btnSiguiente = est.siguiente
            ? `<button class="btn-estado" onclick="avanzarEstado(${i})">${nextLabel(est.siguiente)}</button>`
            : '';
        const btnCancelar = (p.estado !== 'cancelado' && p.estado !== 'entregado')
            ? `<button class="btn-estado btn-cancelar" onclick="cancelarPedido(${i})"><i class="fas fa-times"></i> Cancelar</button>`
            : '';

        return `<div class="pedido-card">
            <div class="pc-header">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span class="pedido-codigo">${p.codigo}</span>
                    ${prioTag}
                </div>
                <span class="estado-badge ${est.class}">${est.label}</span>
            </div>
            <div class="pc-meta">${infoRow}</div>
            <div class="pc-section">
                <div class="pc-section-title"><i class="fas fa-utensils"></i> Platos</div>
                <div class="pc-platos-list">${platosHtml}</div>
            </div>
            ${notaHtml}
            <div class="pedido-footer">
                <span class="pedido-total-lbl">Total: S/ ${p.total.toFixed(2)}</span>
                <div class="pedido-acciones">${btnSiguiente}${btnCancelar}</div>
            </div>
        </div>`;
    }).join('');
}

function nextLabel(estado) {
    const labels = {
        cocina: '<i class="fas fa-paper-plane"></i> Enviar a Cocina',
        preparacion: '<i class="fas fa-fire"></i> En Preparación',
        listo: '<i class="fas fa-bell"></i> Listo para Servir',
        entregado: '<i class="fas fa-check"></i> Marcar Entregado',
    };
    return labels[estado] || estado;
}

function avanzarEstado(i) {
    const p = pedidos[i];
    const flujo = ESTADOS_FLUJO[p.estado];
    if (flujo.siguiente) p.estado = flujo.siguiente;
    renderizarPedidos();
}

function cancelarPedido(i) {
    if (confirm('¿Cancelar este pedido?')) {
        pedidos[i].estado = 'cancelado';
        renderizarPedidos();
    }
}