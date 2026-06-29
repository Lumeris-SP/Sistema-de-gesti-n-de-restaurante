// ============================================================
// js/pages/pedidos.page.js
// MAFFIA — Toma de pedidos (Mozo)
// ============================================================
// Reemplaza a pedidos.js. Cambios importantes frente al original:
//
//   - Esta página NO cargaba auth.js — cualquiera podía tomar
//     pedidos sin sesión. Ahora pasa por Auth.proteger(['Mozo',
//     'Administrador']).
//   - Las credenciales de Supabase hardcodeadas (SUPABASE_URL,
//     SUPABASE_HEADERS) desaparecen: ahora viven solo en
//     supabaseClient.js.
//   - TODA la capa de mapearEstadoInterno()/mapearEstadoCocina()/
//     sincronizarDesdeStorage() del original desaparece. Esa
//     complejidad existía porque pedidos.js, cocina.js y cuenta.js
//     cada uno escribía el estado a su manera en localStorage y
//     había que "traducir" entre formatos. Con una sola tabla
//     `pedidos` y un ENUM real (sql/01_schema.sql), todos los
//     módulos leen el mismo valor de la misma forma — no hay nada
//     que traducir.
//   - El listener de window.addEventListener('storage', ...)
//     desaparece por la misma razón: ya no hay dos copias del
//     dato que puedan desincronizarse.
//
// Requiere supabaseClient.js, core/auth.js,
// services/platosService.js, services/adicionalesService.js y
// services/pedidosService.js cargados antes.
// ============================================================

let PLATOS_DB = [];
let ADICIONALES_DB = [];
let pedidosActivos = [];
let prioridadSeleccionada = 'normal';

const CATEGORIAS = [
    { key: 'Entrada', icono: 'fa-bowl-food', label: 'Entradas' },
    { key: 'Plato de fondo', icono: 'fa-utensils', label: 'Platos de Fondo' },
    { key: 'Menú ejecutivo', icono: 'fa-plate-wheat', label: 'Menú Ejecutivo' },
    { key: 'Postre', icono: 'fa-ice-cream', label: 'Postres' },
    { key: 'Bebida', icono: 'fa-mug-hot', label: 'Bebidas' },
    { key: 'Especial de la casa', icono: 'fa-star', label: 'Especial de la Casa' },
];

// El mozo solo puede avanzar manualmente "registrado -> en cocina".
// De ahí en adelante (en_preparacion, listo) lo controla el
// tablero de cocina, igual que en el proyecto original.
const ESTADOS_FLUJO = {
    registrado: { label: 'Registrado', class: 'estado-registrado', siguiente: 'en_preparacion', siguienteLabel: 'Enviar a Cocina' },
    en_preparacion: { label: 'En Preparación', class: 'estado-preparacion', siguiente: null },
    listo: { label: 'Listo para Servir', class: 'estado-listo', siguiente: null },
    entregado: { label: 'Entregado', class: 'estado-entregado', siguiente: null },
    pagado: { label: 'Pagado', class: 'estado-entregado', siguiente: null },
    cancelado: { label: 'Cancelado', class: 'estado-cancelado', siguiente: null },
};

document.addEventListener('DOMContentLoaded', async () => {
    const autorizado = await Auth.proteger(['Mozo', 'Administrador']);
    if (!autorizado) return;

    await Promise.all([cargarPlatosDB(), cargarAdicionalesDB(), cargarPedidosActivos()]);

    actualizarFechaHora();
    renderizarPlatos();
    renderizarPedidos();

    document.getElementById('pedidoForm').addEventListener('submit', crearPedido);

    document.getElementById('mesa').addEventListener('keydown', (e) => {
        if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
    });

    document.getElementById('mesa').addEventListener('input', function () {
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

    document.getElementById('mozo').addEventListener('input', () => validarMozo(false));
});

// ────────────────────────────────────────────────────────────
// CARGA DE DATOS
// ────────────────────────────────────────────────────────────

async function cargarPlatosDB() {
    PLATOS_DB = await PlatosService.listarActivos();
}

async function cargarAdicionalesDB() {
    ADICIONALES_DB = await AdicionalesService.listar();
}

async function cargarPedidosActivos() {
    pedidosActivos = await PedidosService.listarActivos();
}

function actualizarFechaHora() {
    const opciones = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' };
    const actualizar = () => {
        document.getElementById('fechaHora').textContent = new Date().toLocaleString('es-PE', opciones);
    };
    actualizar();
    setInterval(actualizar, 1000);
}

// ────────────────────────────────────────────────────────────
// RENDER DE PLATOS DISPONIBLES (idéntico al original)
// ────────────────────────────────────────────────────────────

function renderizarPlatos() {
    const contenedor = document.getElementById('platosDisponibles');
    contenedor.innerHTML = '';

    if (PLATOS_DB.length === 0) {
        contenedor.innerHTML = `<p style="color:var(--text-muted);font-size:13px;padding:10px 0;">No hay platos activos registrados.</p>`;
        return;
    }

    CATEGORIAS.forEach((cat) => {
        const platosDeCategoria = PLATOS_DB.filter((p) => p.categoria === cat.key);
        if (platosDeCategoria.length === 0) return;

        const seccion = document.createElement('div');
        seccion.className = 'categoria-seccion';
        seccion.style.cssText =
            'border:1px solid rgba(255,255,255,0.15);border-radius:8px;margin-bottom:10px;overflow:hidden;background:rgba(0,0,0,0.18);';

        const header = document.createElement('div');
        header.className = 'categoria-header';
        header.style.cssText =
            'display:flex;align-items:center;justify-content:space-between;padding:10px 14px;cursor:pointer;background:rgba(255,255,255,0.07);user-select:none;transition:background 0.2s;';
        header.innerHTML = `
            <span style="font-size:14px;font-weight:600;color:var(--text,#eee);letter-spacing:0.3px;">
                <i class="fas ${cat.icono}" style="margin-right:8px;color:var(--gold,#D4AF37);width:16px;text-align:center;"></i>${cat.label}
                <span style="margin-left:10px;background:rgba(255,255,255,0.12);color:var(--text,#eee);font-size:11px;font-weight:500;padding:2px 8px;border-radius:12px;">${platosDeCategoria.length}</span>
            </span>
            <span class="cat-chevron" style="font-size:13px;color:var(--text-muted,#aaa);transition:transform 0.25s;transform:rotate(0deg);">▼</span>
        `;

        const cuerpo = document.createElement('div');
        cuerpo.className = 'categoria-cuerpo';
        cuerpo.style.cssText = 'display:none;padding:8px 10px 10px 10px;';

        header.addEventListener('click', () => {
            const abierto = cuerpo.style.display === 'block';
            cuerpo.style.display = abierto ? 'none' : 'block';
            header.querySelector('.cat-chevron').style.transform = abierto ? 'rotate(0deg)' : 'rotate(180deg)';
        });
        header.addEventListener('mouseenter', () => (header.style.background = 'rgba(255,255,255,0.11)'));
        header.addEventListener('mouseleave', () => (header.style.background = 'rgba(255,255,255,0.07)'));

        platosDeCategoria.forEach((plato) => {
            const div = document.createElement('div');
            div.className = 'plato-item';
            div.id = `plato-item-${plato.id}`;
            div.innerHTML = `
                <div class="plato-header" onclick="togglePlato('${plato.id}', false)">
                    <input class="plato-check" type="checkbox" id="chk-${plato.id}"
                        onclick="event.stopPropagation(); togglePlato('${plato.id}', true)">
                    <span class="plato-name">${plato.nombre}</span>
                    <span class="plato-precio">S/ ${plato.precio.toFixed(2)}</span>
                </div>
                <div class="plato-controls" id="ctrl-${plato.id}">
                    <div class="plato-qty-row">
                        <button type="button" class="qty-btn" aria-label="Disminuir cantidad" title="Disminuir cantidad" onclick="cambiarQty('${plato.id}', -1)"><i class="fas fa-minus"></i></button>
                        <input class="qty-input" type="text" id="qty-${plato.id}" value="1" oninput="validarQty('${plato.id}')" inputmode="numeric">
                        <button type="button" class="qty-btn" aria-label="Aumentar cantidad" title="Aumentar cantidad" onclick="cambiarQty('${plato.id}', 1)"><i class="fas fa-plus"></i></button>
                        <span class="qty-subtotal">Subtotal: <span id="sub-${plato.id}">S/ ${plato.precio.toFixed(2)}</span></span>
                    </div>
                    <div class="obs-list" id="obs-list-${plato.id}"></div>
                    <button type="button" class="btn-add-obs-main" onclick="agregarObservacion('${plato.id}')">
                        <i class="fas fa-plus"></i> Adicionar observación especial
                    </button>
                </div>`;
            cuerpo.appendChild(div);
        });

        seccion.appendChild(header);
        seccion.appendChild(cuerpo);
        contenedor.appendChild(seccion);
    });
}

function togglePlato(platoId, fromCheckbox) {
    const chk = document.getElementById(`chk-${platoId}`);
    const ctrl = document.getElementById(`ctrl-${platoId}`);
    const item = document.getElementById(`plato-item-${platoId}`);
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
    input.value = input.value.replace(/\D/g, '');
    if (parseInt(input.value) < 1 || input.value === '') input.value = '1';
    calcularSubtotal(platoId);
    calcularTotal();
}

function calcularSubtotal(platoId) {
    const plato = PLATOS_DB.find((p) => String(p.id) === String(platoId));
    if (!plato) return;
    const qty = parseInt(document.getElementById(`qty-${platoId}`)?.value) || 1;
    const extras = calcularExtrasObs(platoId);
    const sub = (plato.precio + extras) * qty;
    const el = document.getElementById(`sub-${platoId}`);
    if (el) el.textContent = `S/ ${sub.toFixed(2)}`;
}

function calcularExtrasObs(platoId) {
    const lista = document.getElementById(`obs-list-${platoId}`);
    if (!lista) return 0;
    let extra = 0;
    lista.querySelectorAll('.obs-select').forEach((sel) => {
        const ad = ADICIONALES_DB.find((a) => a.nombre === sel.value);
        if (ad) extra += ad.precio;
    });
    return extra;
}

function calcularTotal() {
    let total = 0;
    PLATOS_DB.forEach((plato) => {
        const chk = document.getElementById(`chk-${plato.id}`);
        if (chk && chk.checked) {
            const qty = parseInt(document.getElementById(`qty-${plato.id}`)?.value) || 1;
            const extras = calcularExtrasObs(plato.id);
            total += (plato.precio + extras) * qty;
        }
    });
    const el = document.getElementById('totalDisplay');
    if (el) el.textContent = `S/ ${total.toFixed(2)}`;
}

// ────────────────────────────────────────────────────────────
// OBSERVACIONES POR PLATO (idéntico al original)
// ────────────────────────────────────────────────────────────

function agregarObservacion(platoId) {
    const lista = document.getElementById(`obs-list-${platoId}`);
    const row = document.createElement('div');
    row.className = 'obs-row';
    const opciones = ADICIONALES_DB.map(
        (a) => `<option value="${a.nombre}">${a.nombre}${a.precio > 0 ? ` (+S/ ${a.precio.toFixed(2)})` : ''}</option>`
    ).join('');
    row.innerHTML = `
        <select class="obs-select" onchange="onObsChange(this, '${platoId}')">
            <option value="">-- Observación/Adicional --</option>
            ${opciones}
            <option value="__custom__">Otro (escribir)...</option>
        </select>
        <button type="button" class="btn-del-obs" onclick="eliminarObservacion(this, '${platoId}')"><i class="fas fa-times"></i></button>
    `;
    lista.appendChild(row);
}

function onObsChange(sel, platoId) {
    const row = sel.parentElement;
    row.querySelector('.obs-custom')?.remove();
    row.querySelector('.obs-counter')?.remove();
    row.querySelector('.obs-extra-costo')?.remove();

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
        const ad = ADICIONALES_DB.find((a) => a.nombre === sel.value);
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

// ────────────────────────────────────────────────────────────
// PRIORIDAD
// ────────────────────────────────────────────────────────────

function setPrioridad(btn) {
    document.querySelectorAll('.prio-btn').forEach((b) => (b.className = 'prio-btn'));
    const p = btn.dataset.prio;
    prioridadSeleccionada = p;
    if (p === 'normal') btn.classList.add('active-normal');
    if (p === 'alta') btn.classList.add('active-alta');
    if (p === 'urgente') btn.classList.add('active-urgente');
    document.getElementById('justificacionBlock').classList.toggle('visible', p === 'urgente');
    document.getElementById('prioError').textContent = '';
}

// ────────────────────────────────────────────────────────────
// VALIDACIONES (idénticas al original)
// ────────────────────────────────────────────────────────────

function validarMozo(mostrarError = true) {
    const val = document.getElementById('mozo').value.trim();
    const err = document.getElementById('mozoError');
    const campo = document.getElementById('mozo');
    if (!val) {
        if (mostrarError) { err.textContent = 'El nombre del mozo es obligatorio'; campo.classList.add('error'); }
        return false;
    }
    if (val.length < 3) {
        if (mostrarError) { err.textContent = 'Mínimo 3 caracteres'; campo.classList.add('error'); }
        return false;
    }
    if (/^\d+$/.test(val)) {
        if (mostrarError) { err.textContent = 'No puede ser solo números'; campo.classList.add('error'); }
        return false;
    }
    err.textContent = '';
    campo.classList.remove('error');
    return true;
}

function validarMesa() {
    const raw = document.getElementById('mesa').value.trim();
    const val = parseInt(raw);
    const err = document.getElementById('mesaError');
    const campo = document.getElementById('mesa');
    if (!raw || isNaN(val) || val < 1 || val > 50) {
        err.textContent = 'Ingrese un número de mesa válido (1 – 50)';
        campo.classList.add('error');
        return false;
    }
    err.textContent = '';
    campo.classList.remove('error');
    return true;
}

function validarPlatos() {
    const seleccionados = PLATOS_DB.filter((p) => document.getElementById(`chk-${p.id}`)?.checked);
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

// ────────────────────────────────────────────────────────────
// CREAR O ACTUALIZAR PEDIDO
// ────────────────────────────────────────────────────────────

async function crearPedido(e) {
    e.preventDefault();

    const okMesa = validarMesa();
    const okMozo = validarMozo(true);
    const okPlatos = validarPlatos();
    const okJust = validarJustificacion();
    if (!okMesa || !okMozo || !okPlatos || !okJust) return;

    const mesaVal = parseInt(document.getElementById('mesa').value);
    const mozoVal = document.getElementById('mozo').value.trim();
    const clienteVal = document.getElementById('cliente').value.trim();
    const observaciones = document.getElementById('observaciones').value.trim();

    const nuevosPlatos = [];
    PLATOS_DB.forEach((plato) => {
        const chk = document.getElementById(`chk-${plato.id}`);
        if (!chk || !chk.checked) return;

        const qty = parseInt(document.getElementById(`qty-${plato.id}`)?.value) || 1;
        const obsData = [];
        const lista = document.getElementById(`obs-list-${plato.id}`);
        if (lista) {
            lista.querySelectorAll('.obs-row').forEach((row) => {
                const sel = row.querySelector('.obs-select');
                if (!sel || !sel.value) return;
                if (sel.value === '__custom__') {
                    const ta = row.querySelector('.obs-custom');
                    if (ta && ta.value.trim()) obsData.push({ texto: ta.value.trim(), extra: 0 });
                } else {
                    const ad = ADICIONALES_DB.find((a) => a.nombre === sel.value);
                    obsData.push({ texto: sel.value, extra: ad ? ad.precio : 0 });
                }
            });
        }

        const extras = obsData.reduce((s, o) => s + o.extra, 0);
        nuevosPlatos.push({
            platoId: plato.id,
            nombre: plato.nombre,
            precioUnitario: plato.precio,
            cantidad: qty,
            subtotal: (plato.precio + extras) * qty,
            adicionales: obsData,
            tiempoEstimadoMin: plato.tiempoMinutos,
        });
    });

    const justSel = document.getElementById('justificacionSelect').value;
    const justTxt = document.getElementById('justificacionTexto').value.trim();
    const justificacion = prioridadSeleccionada === 'urgente' ? (justSel === 'Otro' ? justTxt : justSel) : '';

    // Buscar si la mesa ya tiene un pedido activo, igual que el
    // original, para no duplicar — pero ahora la verificación y
    // el "merge" de platos los hace PedidosService.agregarItems()
    // directamente contra la base de datos.
    const pedidoExistente = pedidosActivos.find(
        (p) => parseInt(p.mesa) === mesaVal && p.estado !== 'entregado' && p.estado !== 'cancelado' && p.estado !== 'pagado'
    );

    if (pedidoExistente) {
        await PedidosService.agregarItems(pedidoExistente.id, nuevosPlatos);
        alert(`Se han añadido platos al pedido existente de la Mesa ${mesaVal}`);
    } else {
        const resultado = await PedidosService.crear({
            mesa: mesaVal,
            mozo: mozoVal,
            cliente: clienteVal,
            observacionGeneral: observaciones,
            prioridad: prioridadSeleccionada === 'urgente' ? 'urgente' : 'normal',
            justificacionUrgente: justificacion,
            items: nuevosPlatos,
        });

        if (!resultado.ok) {
            alert(resultado.mensaje || 'No se pudo crear el pedido');
            return;
        }
    }

    await cargarPedidosActivos();
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
    document.querySelectorAll('.prio-btn').forEach((b) => (b.className = 'prio-btn'));
    const btnNormal = document.querySelector('[data-prio="normal"]');
    if (btnNormal) btnNormal.classList.add('active-normal');

    renderizarPlatos();
    document.getElementById('totalDisplay').textContent = 'S/ 0.00';
    document.getElementById('mesa').focus();
}

// ────────────────────────────────────────────────────────────
// RENDER DE PEDIDOS ACTIVOS
// ────────────────────────────────────────────────────────────

function renderizarPedidos() {
    const cont = document.getElementById('pedidosList');
    if (pedidosActivos.length === 0) {
        cont.innerHTML = `<div class="empty-state"><i class="fas fa-clipboard"></i>No hay pedidos activos</div>`;
        return;
    }

    const mesaCount = {};
    pedidosActivos.forEach((p) => {
        if (p.estado !== 'cancelado' && p.estado !== 'entregado') {
            mesaCount[p.mesa] = (mesaCount[p.mesa] || 0) + 1;
        }
    });

    cont.innerHTML = pedidosActivos
        .map((p) => {
            const est = ESTADOS_FLUJO[p.estado] || ESTADOS_FLUJO.registrado;
            const prio = p.prioridad;
            const prioTag = `<span class="prio-tag prio-${prio}">${prio.charAt(0).toUpperCase() + prio.slice(1)}</span>`;
            const multimesa =
                mesaCount[p.mesa] > 1
                    ? `<span style="color:var(--yellow);font-size:10px;"><i class="fas fa-exclamation-circle"></i> ${mesaCount[p.mesa]} pedidos en esta mesa</span>`
                    : '';
            const fecha = p.fecha
                ? new Date(p.fecha).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '';

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
                ${p.justificacionUrgente ? `<div style="font-size:11px;color:var(--red);margin-top:4px;"><i class="fas fa-exclamation-triangle"></i> ${p.justificacionUrgente}</div>` : ''}
            `;

            const platosHtml = (p.platos || [])
                .map((pl) => {
                    const obsHtml =
                        pl.observaciones && pl.observaciones.length > 0
                            ? `<div class="pc-plato-obs-block">
                            <span class="pc-obs-label">Obs. del plato:</span>
                            <div class="pc-obs-tags">
                                ${pl.observaciones.map((o) => `<span class="pc-obs-tag">${o.texto}${o.extra > 0 ? ` <strong>+S/ ${o.extra.toFixed(2)}</strong>` : ''}</span>`).join('')}
                            </div>
                        </div>`
                            : '';
                    return `
                        <div class="pc-plato-item">
                            <div class="pc-plato-top">
                                <span class="pc-plato-nombre">${pl.nombre}</span>
                                <span class="pc-plato-detalle">x${pl.cantidad} · S/ ${pl.subtotal.toFixed(2)}</span>
                            </div>
                            ${obsHtml}
                        </div>`;
                })
                .join('');

            const notaHtml = p.observaciones
                ? `<div class="pc-section">
                    <div class="pc-section-title"><i class="fas fa-comment"></i> Nota general del pedido</div>
                    <div class="pc-nota-general">${p.observaciones}</div>
                </div>`
                : '';

            const btnSiguiente = est.siguiente
                ? `<button class="btn-estado" onclick="avanzarEstado('${p.id}')">${est.siguienteLabel ? `<i class="fas fa-paper-plane"></i> ${est.siguienteLabel}` : ''}</button>`
                : '';
            const btnCancelar =
                p.estado !== 'cancelado' && p.estado !== 'entregado' && p.estado !== 'pagado'
                    ? `<button class="btn-estado btn-cancelar" onclick="cancelarPedido('${p.id}')"><i class="fas fa-times"></i> Cancelar</button>`
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
        })
        .join('');
}

async function avanzarEstado(pedidoId) {
    const pedido = pedidosActivos.find((p) => p.id === pedidoId);
    if (!pedido) return;
    const flujo = ESTADOS_FLUJO[pedido.estado];
    if (!flujo || !flujo.siguiente) return;

    // Traducir el siguiente estado del flujo (snake_case de UI)
    // al valor que espera PedidosService (estado_cocina en Pascal).
    const mapaEstadoCocina = {
        en_preparacion: 'En preparación',
        listo: 'Listo',
    };
    const estadoCocina = mapaEstadoCocina[flujo.siguiente];
    if (!estadoCocina) return;

    const resultado = await PedidosService.cambiarEstadoPedido(pedidoId, estadoCocina);
    if (!resultado.ok) {
        alert(resultado.mensaje);
        return;
    }
    await cargarPedidosActivos();
    renderizarPedidos();
}

async function cancelarPedido(pedidoId) {
    if (!confirm('¿Cancelar este pedido?')) return;

    const resultado = await PedidosService.cancelar(pedidoId);
    if (!resultado.ok) {
        alert('No se pudo cancelar el pedido: ' + resultado.mensaje);
        return;
    }
    await cargarPedidosActivos();
    renderizarPedidos();
}
