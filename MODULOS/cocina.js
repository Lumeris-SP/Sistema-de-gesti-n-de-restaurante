// cocina.js - Módulo 3: Tablero de Cocina - Walok Restaurante Oriental
class ControlCocina {
    constructor() {
        this.pedidos = [];
        this.platos  = [];          // ← catálogo de platos para enriquecer ítems
        this.filtro  = 'todos';
        this.orden   = 'hora';
        this.init();
    }

    init() {
        this.cargarDatos();
        this.registrarEventos();
        this.actualizarVista();
        setInterval(() => {
            this.cargarDatos();
            this.actualizarVista();
        }, 15000);
    }

    // ── Carga pedidos Y catálogo de platos ──────────────────────────────────
    cargarDatos() {
        this.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        this.platos  = JSON.parse(localStorage.getItem('platos'))  || [];
    }

    guardarPedidos() {
        localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
        this.actualizarVista();
        window.dispatchEvent(new StorageEvent('storage', { key: 'pedidos' }));
    }

    registrarEventos() {
        window.addEventListener('storage', (e) => {
            // Reacciona tanto a cambios en pedidos como en el catálogo de platos
            if (e.key === 'pedidos' || e.key === 'platos') {
                this.cargarDatos();
                this.actualizarVista();
            }
        });

        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
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

    // ── Helpers ─────────────────────────────────────────────────────────────

    formatearFecha(fecha) {
        if (!fecha) return '';
        const d = new Date(fecha);
        if (isNaN(d.getTime())) return fecha;
        return d.toLocaleString('es-PE', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    estadoGeneral(pedido) {
        if (!pedido.items || pedido.items.length === 0) {
            return pedido.estadoCocina || 'Pendiente';
        }
        const estados = pedido.items.map(i => i.estadoPlato || pedido.estadoCocina || 'Pendiente');
        if (estados.every(e => e === 'Listo')) return 'Listo';
        if (estados.some(e => e === 'En preparación' || e === 'Listo')) return 'En preparación';
        return 'Pendiente';
    }

    progresoEstado(estado) {
        if (estado === 'Listo')          return 100;
        if (estado === 'En preparación') return 50;
        return 10;
    }

    /**
     * INTEGRACIÓN PLATOS
     * Devuelve la info de cocina (alérgenos + modificable) para un ítem.
     * Prioridad: datos ya guardados en el ítem → catálogo en memoria.
     * Así funciona aunque el módulo de platos no esté cargado en la misma
     * pestaña.
     */
    _infoCocinaItem(item) {
        // 1. Intentar con lo que ya viene en el ítem del pedido
        let alergenos = [];
        if (Array.isArray(item.alergenos)) {
            alergenos = item.alergenos.filter(a => a && a.toLowerCase() !== 'ninguno');
        } else if (typeof item.alergenos === 'string' && item.alergenos.trim()) {
            alergenos = item.alergenos.split(',').map(a => a.trim())
                            .filter(a => a && a.toLowerCase() !== 'ninguno');
        }

        // Añadir otroAlergeno si existe
        const otro = (item.otroAlergeno || '').trim();
        if (otro && !alergenos.includes(otro)) alergenos.push(otro);

        // Modificaciones permitidas del catálogo (field "modificable")
        let modificable = (item.modificable || '').trim();

        // 2. Si falta algún dato, buscar en el catálogo
        const sinAlergenos   = alergenos.length === 0;
        const sinModificable = !modificable;

        if ((sinAlergenos || sinModificable) && item.platoId) {
            const catalogo = this.platos.find(p => String(p.id) === String(item.platoId));
            if (catalogo) {
                if (sinAlergenos) {
                    alergenos = (catalogo.alergenos || [])
                        .filter(a => a && a.toLowerCase() !== 'ninguno');
                    const otroC = (catalogo.otroAlergeno || '').trim();
                    if (otroC && !alergenos.includes(otroC)) alergenos.push(otroC);
                }
                if (sinModificable) {
                    modificable = (catalogo.modificable || '').trim();
                }
            }
        }

        // Observación del mozo para ese plato específico (escrita al tomar el pedido)
        const observacion = (item.modificaciones || item.observacion || item.obs || '').trim();

        return { alergenos, modificable, observacion };
    }

    // ── Acciones ─────────────────────────────────────────────────────────────

    cambiarEstadoPlato(pedidoId, itemIndex, nuevoEstado) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;
        if (pedido.estado === 'Cancelado') {
            this.mostrarToast('No se puede modificar un pedido cancelado', 'error');
            return;
        }
        pedido.items[itemIndex].estadoPlato = nuevoEstado;
        pedido.estadoCocina = this.estadoGeneral(pedido);
        this.guardarPedidos();
    }

    cambiarEstadoPedido(pedidoId, nuevoEstado) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (!pedido) return;

        if (pedido.estado === 'Cancelado') {
            this.mostrarToast('No se puede modificar un pedido cancelado', 'error');
            return;
        }

        if (nuevoEstado === 'Listo') {
            const yaEnCocina = pedido.items && pedido.items.some(
                i => i.estadoPlato === 'En preparación' || i.estadoPlato === 'Listo'
            );
            if (!yaEnCocina && pedido.estadoCocina === 'Pendiente') {
                this.mostrarToast('El pedido debe iniciar preparación antes de marcarse como Listo', 'error');
                return;
            }
        }

        if (pedido.items) {
            pedido.items.forEach(item => {
                if (nuevoEstado === 'Listo') {
                    item.estadoPlato = 'Listo';
                } else if (nuevoEstado === 'En preparación') {
                    if (!item.estadoPlato || item.estadoPlato === 'Pendiente') {
                        item.estadoPlato = 'En preparación';
                    }
                }
            });
        }

        pedido.estadoCocina = nuevoEstado;
        this.guardarPedidos();

        const mensajes = {
            'En preparación': 'Pedido enviado a preparación',
            'Listo': 'Pedido marcado como listo para servir'
        };
        this.mostrarToast(mensajes[nuevoEstado] || '', 'ok');
    }

    mostrarToast(mensaje, tipo = 'ok') {
        const toast = document.getElementById('toastCocina');
        if (!toast) return;
        toast.textContent  = mensaje;
        toast.className    = 'toast-cocina show ' + (tipo === 'error' ? 'toast-error' : 'toast-ok');
        clearTimeout(this._toastTimer);
        this._toastTimer   = setTimeout(() => toast.classList.remove('show'), 2800);
    }

    // ── Render ───────────────────────────────────────────────────────────────

    actualizarVista() {
        let pedidosCocina = this.pedidos.filter(
            p => p.estado !== 'Cancelado' && p.estado !== 'Pagado'
        );

        let lista = pedidosCocina;
        if (this.filtro === 'urgente') {
            lista = lista.filter(p => p.urgente);
        } else if (this.filtro !== 'todos') {
            lista = lista.filter(p => this.estadoGeneral(p) === this.filtro);
        }

        lista = [...lista];
        switch (this.orden) {
            case 'horaDesc': lista.sort((a, b) => Number(b.id) - Number(a.id)); break;
            case 'tiempo':   lista.sort((a, b) => (b.tiempoTotal || 0) - (a.tiempoTotal || 0)); break;
            case 'urgente':  lista.sort((a, b) => (b.urgente ? 1 : 0) - (a.urgente ? 1 : 0)); break;
            default:         lista.sort((a, b) => Number(a.id) - Number(b.id)); break;
        }

        const pendientes = pedidosCocina.filter(p => this.estadoGeneral(p) === 'Pendiente').length;
        const enPrep     = pedidosCocina.filter(p => this.estadoGeneral(p) === 'En preparación').length;
        const listos     = pedidosCocina.filter(p => this.estadoGeneral(p) === 'Listo').length;

        const el = id => document.getElementById(id);
        if (el('pendientesCount'))  el('pendientesCount').textContent  = pendientes;
        if (el('preparacionCount')) el('preparacionCount').textContent = enPrep;
        if (el('listosCount'))      el('listosCount').textContent      = listos;

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

        container.innerHTML = lista.map(p => this.renderizarPedido(p)).join('');
    }

    renderizarPedido(pedido) {
        const eg        = this.estadoGeneral(pedido);
        const esUrgente = !!pedido.urgente;
        const tiempoMax = pedido.tiempoTotal ||
            (pedido.items?.length ? Math.max(...pedido.items.map(i => parseInt(i.tiempo) || 0)) : 0);
        const mozo      = pedido.mozo || pedido.cliente || '—';
        const progreso  = this.progresoEstado(eg);
        const fecha     = this.formatearFecha(pedido.fecha);

        const estadoIcono = { 'Pendiente': '⏳', 'En preparación': '🔥', 'Listo': '✅' };
        const badgeClass  = eg === 'Pendiente'      ? 'estado-pendiente'
                          : eg === 'En preparación' ? 'estado-preparacion'
                          : 'estado-listo';

        // ── Platos individuales ──────────────────────────────────────────────
        const platosHTML = (pedido.items || []).map((item, idx) => {
            const epPlato = item.estadoPlato || pedido.estadoCocina || 'Pendiente';
            const epClass = epPlato === 'Pendiente'      ? 'estado-pendiente'
                          : epPlato === 'En preparación' ? 'estado-preparacion'
                          : 'estado-listo';
            const cantidad = item.cantidad || 1;

            // ── Datos de cocina enriquecidos (alérgenos + modificable + obs mozo)
            const { alergenos, modificable, observacion } = this._infoCocinaItem(item);
            const aleStr = alergenos.join(', ');

            return `
                <div class="plato-row">
                    <div class="plato-cant">${cantidad}x</div>
                    <div class="plato-info">
                        <span class="plato-nombre">${item.nombre || ''}</span>
                        ${item.tiempo
                            ? `<span class="plato-tiempo">
                                <i class="fas fa-clock"></i> ${item.tiempo} min
                               </span>`
                            : ''}

                        <!-- OBSERVACIÓN DEL MOZO (por pedido) -->
                        ${observacion
                            ? `<div class="plato-obs">
                                <i class="fas fa-pencil-alt"></i>
                                <span><strong>Observación del mozo:</strong> ${observacion}</span>
                               </div>`
                            : `<div class="plato-sin-obs">
                                <i class="fas fa-minus-circle"></i> Sin observaciones del mozo
                               </div>`}

                        <!-- MODIFICACIONES PERMITIDAS (del catálogo de platos) -->
                        ${modificable
                            ? `<div class="plato-modificable">
                                <i class="fas fa-sliders-h"></i>
                                <span><strong>Modificaciones posibles:</strong> ${modificable}</span>
                               </div>`
                            : `<div class="plato-sin-modificable">
                                <i class="fas fa-ban"></i> Sin modificaciones registradas
                               </div>`}

                        <!-- ALÉRGENOS (del catálogo, actualizados en tiempo real) -->
                        ${aleStr
                            ? `<div class="plato-alergenos">
                                <i class="fas fa-exclamation-triangle"></i>
                                <span><strong>⚠ Alérgenos:</strong> ${aleStr}</span>
                               </div>`
                            : `<div class="plato-sin-alergenos">
                                <i class="fas fa-shield-alt"></i> Sin alérgenos
                               </div>`}
                    </div>
                    <select class="plato-estado-select ${epClass}"
                        onchange="controlCocina.cambiarEstadoPlato('${pedido.id}', ${idx}, this.value)">
                        <option value="Pendiente"      ${epPlato === 'Pendiente'      ? 'selected' : ''}>⏳ Pendiente</option>
                        <option value="En preparación" ${epPlato === 'En preparación' ? 'selected' : ''}>🔥 En preparación</option>
                        <option value="Listo"          ${epPlato === 'Listo'          ? 'selected' : ''}>✅ Listo</option>
                    </select>
                </div>`;
        }).join('');

        return `
            <div class="pedido-cocina-card ${esUrgente ? 'pedido-urgente' : ''}">

                ${esUrgente ? `
                    <div class="urgente-banner">
                        <i class="fas fa-exclamation-triangle"></i>
                        <strong>PEDIDO URGENTE</strong>
                        ${pedido.justificacionUrgente
                            ? `<span>— ${pedido.justificacionUrgente}</span>`
                            : ''}
                    </div>` : ''}

                <!-- ENCABEZADO -->
                <div class="pedido-header">
                    <div class="pedido-header-info">
                        <h3 class="pedido-codigo">
                            Pedido #${pedido.id.toString().slice(-6)}
                            ${esUrgente ? '<span class="urgente-chip">URGENTE</span>' : ''}
                        </h3>
                        <div class="pedido-meta">
                            <span><i class="fas fa-chair"></i> Mesa ${pedido.mesa}</span>
                            <span><i class="fas fa-user"></i> ${mozo}</span>
                            <span><i class="fas fa-clock"></i> ${fecha}</span>
                            <span><i class="fas fa-hourglass-half"></i> ${tiempoMax} min estimados</span>
                            <span class="prioridad-label ${esUrgente ? 'prioridad-alta' : 'prioridad-normal'}">
                                <i class="fas fa-flag"></i>
                                Prioridad: ${esUrgente ? 'Alta' : 'Normal'}
                            </span>
                        </div>
                    </div>
                    <div class="pedido-header-estado">
                        <span class="estado-badge ${badgeClass}">
                            ${estadoIcono[eg] || ''} ${eg}
                        </span>
                    </div>
                </div>

                <!-- PLATOS -->
                <div class="platos-detalle">
                    <p class="platos-titulo">
                        <i class="fas fa-utensils"></i> Platos del pedido
                    </p>
                    ${platosHTML || '<p class="sin-platos">Sin platos registrados</p>'}
                </div>

                <!-- OBSERVACIÓN GENERAL DEL PEDIDO -->
                ${pedido.observaciones
                    ? `<div class="obs-general">
                        <i class="fas fa-sticky-note"></i>
                        <span><strong>Observación general del pedido:</strong> ${pedido.observaciones}</span>
                       </div>`
                    : ''}

                <!-- ACCIONES GLOBALES -->
                <div class="item-actions">
                    ${this.renderizarBotones(pedido, eg)}
                </div>

                <!-- BARRA DE PROGRESO -->
                <div class="progress-bar">
                    <div class="progress-fill progress-${eg === 'Pendiente' ? 'pendiente' : eg === 'En preparación' ? 'prep' : 'listo'}"
                         style="width: ${progreso}%">
                    </div>
                </div>

            </div>`;
    }

    renderizarBotones(pedido, estadoGeneral) {
        switch (estadoGeneral) {
            case 'Pendiente':
                return `
                    <button class="btn-accion btn-preparacion"
                        onclick="controlCocina.cambiarEstadoPedido('${pedido.id}', 'En preparación')">
                        <i class="fas fa-play"></i> Iniciar preparación
                    </button>`;
            case 'En preparación':
                return `
                    <button class="btn-accion btn-listo"
                        onclick="controlCocina.cambiarEstadoPedido('${pedido.id}', 'Listo')">
                        <i class="fas fa-check"></i> Marcar todos como listos
                    </button>`;
            case 'Listo':
                return `
                    <button class="btn-accion btn-completado" disabled>
                        <i class="fas fa-check-circle"></i> Listo para servir
                    </button>`;
            default:
                return '';
        }
    }
}

let controlCocina;
document.addEventListener('DOMContentLoaded', () => {
    controlCocina = new ControlCocina();
});