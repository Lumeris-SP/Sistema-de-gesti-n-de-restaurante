// ============================================================
// js/pages/cocina.page.js
// MAFFIA — Tablero de cocina
// ============================================================
// Reemplaza a cocina.js. Diferencias clave frente al original:
//   - Esta página NO cargaba auth.js en el HTML original —
//     cualquiera podía abrirla sin sesión. Ahora pasa por
//     Auth.proteger(['Cocina', 'Administrador']).
//   - El listener de window.addEventListener('storage', ...) que
//     reaccionaba a cambios en localStorage ya no aplica (Supabase
//     no dispara ese evento). En su lugar mantenemos el mismo
//     polling de 15s que ya existía como fallback, y dejamos la
//     puerta abierta a Supabase Realtime más adelante si se
//     necesita actualización instantánea entre pestañas/dispositivos.
//   - Antes cambiarEstadoPlato(pedidoCodigo, itemIndex, estado)
//     ubicaba el ítem por posición en el array. Ahora cada ítem
//     tiene su propio id (UUID) en pedido_items, así que se pasa
//     directamente ese id — más simple y sin riesgo de índices
//     desalineados.
//
// Requiere supabaseClient.js, core/auth.js y
// services/pedidosService.js cargados antes.
// ============================================================

class ControlCocina {
    constructor() {
        this.pedidos = [];
        this.filtro = 'todos';
        this.orden = 'hora';
        this._toastTimer = null;
    }

    async init() {
        const autorizado = await Auth.proteger(['Cocina', 'Administrador']);
        if (!autorizado) return;

        await this.cargarDatos();
        this.registrarEventos();
        this.actualizarVista();

        setInterval(async () => {
            await this.cargarDatos();
            this.actualizarVista();
        }, 15000);
    }

    async cargarDatos() {
        this.pedidos = await PedidosService.listarActivos();
    }

    registrarEventos() {
        document.querySelectorAll('.filter-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                this.filtro = btn.dataset.filter;
                this.actualizarVista();
            });
        });

        const sortSelect = document.getElementById('sortSelect');
        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                this.orden = sortSelect.value;
                this.actualizarVista();
            });
        }
    }

    formatearFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        if (isNaN(d.getTime())) return fecha;
        return d.toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
        });
    }

    estadoGeneral(pedido) {
        if (!pedido.platos || pedido.platos.length === 0) {
            return pedido.estadoCocina || 'Pendiente';
        }
        const estados = pedido.platos.map((i) => i.estadoPlato || pedido.estadoCocina || 'Pendiente');
        if (estados.every((e) => e === 'Listo')) return 'Listo';
        if (estados.some((e) => e === 'En preparación' || e === 'Listo')) return 'En preparación';
        return 'Pendiente';
    }

    progresoEstado(estado) {
        if (estado === 'Listo') return 100;
        if (estado === 'En preparación') return 50;
        return 10;
    }

    async cambiarEstadoPlato(itemId, nuevoEstado) {
        const resultado = await PedidosService.cambiarEstadoItem(itemId, nuevoEstado);
        if (!resultado.ok) {
            this.mostrarToast(resultado.mensaje, 'error');
            return;
        }
        await this.cargarDatos();
        this.actualizarVista();
        this.mostrarToast(`Plato marcado como ${nuevoEstado}`, 'ok');
    }

    async cambiarEstadoPedido(pedidoId, nuevoEstado) {
        const resultado = await PedidosService.cambiarEstadoPedido(pedidoId, nuevoEstado);
        if (!resultado.ok) {
            this.mostrarToast(resultado.mensaje, 'error');
            return;
        }
        await this.cargarDatos();
        this.actualizarVista();
        const mensajes = {
            'En preparación': 'Pedido enviado a preparación',
            Listo: 'Pedido marcado como listo para servir',
        };
        this.mostrarToast(mensajes[nuevoEstado] || '', 'ok');
    }

    mostrarToast(mensaje, tipo = 'ok') {
        const toast = document.getElementById('toastCocina');
        if (!toast) return;

        toast.className = 'toast-cocina';
        if (tipo === 'ok') toast.classList.add('toast-success');
        else if (tipo === 'error') toast.classList.add('toast-error');

        const icono = tipo === 'ok' ? 'fa-check-circle' : 'fa-exclamation-circle';
        toast.innerHTML = `
            <div class="toast-inner">
                <i class="fas ${icono}"></i>
                <span>${mensaje}</span>
            </div>`;

        toast.classList.add('show');
        clearTimeout(this._toastTimer);
        this._toastTimer = setTimeout(() => toast.classList.remove('show'), 3500);
    }

    actualizarVista() {
        let pedidosCocina = this.pedidos.filter((p) => {
            const est = (p.estado || '').toLowerCase();
            return est !== 'cancelado' && est !== 'pagado' && est !== 'facturado';
        });

        let lista = pedidosCocina;
        if (this.filtro === 'urgente') {
            lista = lista.filter((p) => p.urgente);
        } else if (this.filtro !== 'todos') {
            lista = lista.filter((p) => this.estadoGeneral(p) === this.filtro);
        }

        lista = [...lista];
        switch (this.orden) {
            case 'horaDesc':
                lista.sort((a, b) => Number(b.codigo.replace('PED', '')) - Number(a.codigo.replace('PED', '')));
                break;
            case 'tiempo':
                lista.sort((a, b) => (b.total || 0) - (a.total || 0));
                break;
            case 'urgente':
                lista.sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0));
                break;
            default:
                lista.sort((a, b) => Number(a.codigo.replace('PED', '')) - Number(b.codigo.replace('PED', '')));
                break;
        }

        const pendientes = pedidosCocina.filter((p) => this.estadoGeneral(p) === 'Pendiente').length;
        const enPrep = pedidosCocina.filter((p) => this.estadoGeneral(p) === 'En preparación').length;
        const listos = pedidosCocina.filter((p) => this.estadoGeneral(p) === 'Listo').length;

        const el = (id) => document.getElementById(id);
        if (el('pendientesCount')) el('pendientesCount').textContent = pendientes;
        if (el('preparacionCount')) el('preparacionCount').textContent = enPrep;
        if (el('listosCount')) el('listosCount').textContent = listos;

        const container = el('cocinaPedidos');
        if (!container) return;

        if (lista.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No hay pedidos que mostrar</p>
                </div>`;
            return;
        }

        container.innerHTML = lista.map((p) => this.renderizarPedido(p)).join('');
    }

    renderizarPedido(pedido) {
        const eg = this.estadoGeneral(pedido);
        const esUrgente = !!pedido.urgente;
        const tiempoMax = pedido.platos && pedido.platos.length
            ? Math.max(...pedido.platos.map((i) => parseInt(i.tiempo) || 0))
            : 0;
        const mozo = pedido.mozo || pedido.cliente || '—';
        const progreso = this.progresoEstado(eg);
        const fecha = this.formatearFecha(pedido.fecha);

        const estadoIcono = { Pendiente: '⏳', 'En preparación': '🔥', Listo: '✅' };
        const badgeClass =
            eg === 'Pendiente' ? 'estado-pendiente' : eg === 'En preparación' ? 'estado-preparacion' : 'estado-listo';
        const cardEstadoClass =
            eg === 'Pendiente' ? 'estado-pendiente-card' : eg === 'En preparación' ? 'estado-preparacion-card' : 'estado-listo-card';

        const platosHTML = (pedido.platos || [])
            .map((item) => {
                const epPlato = item.estadoPlato || pedido.estadoCocina || 'Pendiente';
                const cantidad = item.cantidad || 1;

                let extrasHTML = '';
                if (Array.isArray(item.observaciones) && item.observaciones.length > 0) {
                    const tags = item.observaciones
                        .map(
                            (o) => `
                        <span class="obs-extra-tag">
                            ${o.texto}
                            ${o.extra > 0 ? `<strong>+S/ ${o.extra.toFixed(2)}</strong>` : ''}
                        </span>`
                        )
                        .join('');
                    extrasHTML = `<div class="plato-obs-extras"><i class="fas fa-plus-circle"></i>${tags}</div>`;
                }

                return `
                    <div class="plato-row">
                        <div class="plato-cant">${cantidad}x</div>
                        <div class="plato-info">
                            <span class="plato-nombre">${item.nombre || ''}</span>
                            ${item.tiempo ? `<span class="plato-tiempo"><i class="fas fa-clock"></i> ${item.tiempo} min</span>` : ''}
                            ${extrasHTML || `<div class="plato-sin-obs"><i class="fas fa-minus-circle"></i> Sin extras</div>`}
                        </div>
                        <div class="plato-estado-buttons">
                            <button type="button"
                                class="btn-estado-plato ${epPlato === 'Pendiente' ? 'active' : ''}"
                                ${epPlato !== 'Pendiente' ? 'disabled' : ''}
                                onclick="controlCocina.cambiarEstadoPlato('${item.id}', 'Pendiente')">
                                <i class="fas fa-hourglass-start"></i><span>Pendiente</span>
                            </button>
                            <button type="button"
                                class="btn-estado-plato ${epPlato === 'En preparación' ? 'active' : ''}"
                                ${epPlato === 'Listo' ? 'disabled' : ''}
                                onclick="controlCocina.cambiarEstadoPlato('${item.id}', 'En preparación')">
                                <i class="fas fa-fire"></i><span>Cocinando</span>
                            </button>
                            <button type="button"
                                class="btn-estado-plato ${epPlato === 'Listo' ? 'active' : ''}"
                                onclick="controlCocina.cambiarEstadoPlato('${item.id}', 'Listo')">
                                <i class="fas fa-check-circle"></i><span>Listo</span>
                            </button>
                        </div>
                    </div>`;
            })
            .join('');

        return `
            <div class="pedido-cocina-card ${cardEstadoClass} ${esUrgente ? 'pedido-urgente' : ''}">
                ${esUrgente ? `
                    <div class="urgente-banner">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>PEDIDO URGENTE</strong>
                        ${pedido.justificacionUrgente ? `<span>— ${pedido.justificacionUrgente}</span>` : ''}
                    </div>` : ''}
                <div class="pedido-header">
                    <div class="pedido-header-info">
                        <h3 class="pedido-codigo">
                            Pedido #${pedido.codigo}
                            ${esUrgente ? '<span class="urgente-chip">URGENTE</span>' : ''}
                        </h3>
                        <div class="pedido-meta">
                            <span><i class="fas fa-chair"></i> Mesa ${pedido.mesa}</span>
                            <span><i class="fas fa-user"></i> ${mozo}</span>
                            <span><i class="fas fa-clock"></i> ${fecha}</span>
                            <span><i class="fas fa-hourglass-half"></i> ${tiempoMax} min estimados</span>
                            <span class="prioridad-label ${esUrgente ? 'prioridad-alta' : 'prioridad-normal'}">
                                <i class="fas fa-flag"></i> Prioridad: ${esUrgente ? 'Alta' : 'Normal'}
                            </span>
                        </div>
                    </div>
                    <div class="pedido-header-estado">
                        <span class="estado-badge ${badgeClass}">${estadoIcono[eg] || ''} ${eg}</span>
                    </div>
                </div>
                <div class="platos-detalle">
                    <p class="platos-titulo"><i class="fas fa-utensils"></i> Platos del pedido</p>
                    ${platosHTML || '<p class="sin-platos">Sin platos registrados</p>'}
                </div>
                ${pedido.observaciones ? `
                    <div class="obs-general">
                        <i class="fas fa-sticky-note"></i>
                        <span><strong>Observación general del pedido:</strong> ${pedido.observaciones}</span>
                    </div>` : ''}
                <div class="item-actions">${this.renderizarBotones(pedido, eg)}</div>
                <div class="progress-bar">
                    <div class="progress-fill progress-${eg === 'Pendiente' ? 'pendiente' : eg === 'En preparación' ? 'prep' : 'listo'}"
                         style="width: ${progreso}%"></div>
                </div>
            </div>`;
    }

    renderizarBotones(pedido, estadoGeneral) {
        switch (estadoGeneral) {
            case 'Pendiente':
                return `
                    <button class="btn-accion btn-preparacion"
                        onclick="controlCocina.cambiarEstadoPedido('${pedido.id}', 'En preparación')">
                        <i class="fas fa-play"></i>
                        <span class="btn-text">Iniciar preparación</span>
                        <span class="btn-subtext">Comienza la cocina</span>
                    </button>`;
            case 'En preparación':
                return `
                    <button class="btn-accion btn-listo-pedido"
                        onclick="controlCocina.cambiarEstadoPedido('${pedido.id}', 'Listo')">
                        <i class="fas fa-check-double"></i>
                        <span class="btn-text">Marcar todos como listos</span>
                        <span class="btn-subtext">Presiona para completar</span>
                    </button>`;
            case 'Listo':
                return `
                    <button class="btn-accion btn-completado" disabled>
                        <i class="fas fa-star"></i>
                        <span class="btn-text">¡Listo para servir!</span>
                    </button>`;
            default:
                return '';
        }
    }
}

let controlCocina;
document.addEventListener('DOMContentLoaded', async () => {
    controlCocina = new ControlCocina();
    await controlCocina.init();
});