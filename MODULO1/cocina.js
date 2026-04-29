// cocina.js - Control de estado de preparación
class ControlCocina {
    constructor() {
        this.pedidos = [];
        this.init();
    }

    init() {
        this.cargarDatos();
        this.registrarEventos();
        this.actualizarVista();
        
        // Actualizar cada 30 segundos
        setInterval(() => {
            this.cargarDatos();
            this.actualizarVista();
        }, 30000);
    }

    cargarDatos() {
        this.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    }

    guardarPedidos() {
        localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
        this.actualizarVista();
        this.actualizarDashboard();
    }

    actualizarDashboard() {
        window.dispatchEvent(new StorageEvent('storage', { key: 'pedidos' }));
    }

    registrarEventos() {
        // Escuchar cambios en storage de otras pestañas
        window.addEventListener('storage', (e) => {
            if (e.key === 'pedidos') {
                this.cargarDatos();
                this.actualizarVista();
            }
        });
    }

    actualizarEstado(pedidoId, nuevoEstado) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (pedido && pedido.estado !== 'Pagado') {
            pedido.estadoCocina = nuevoEstado;
            this.guardarPedidos();
            
            let mensaje = '';
            switch(nuevoEstado) {
                case 'En preparación':
                    mensaje = 'Pedido enviado a preparación';
                    break;
                case 'Listo':
                    mensaje = 'Pedido marcado como listo para servir';
                    break;
            }
            alert(mensaje);
        }
    }

    actualizarVista() {
        const pedidosPendientes = this.pedidos.filter(p => p.estado === 'Activo' && p.estadoCocina !== 'Pagado');
        
        // Contar por estado
        const pendientes = pedidosPendientes.filter(p => p.estadoCocina === 'Pendiente').length;
        const enPreparacion = pedidosPendientes.filter(p => p.estadoCocina === 'En preparación').length;
        const listos = pedidosPendientes.filter(p => p.estadoCocina === 'Listo').length;
        
        document.getElementById('pendientesCount').textContent = pendientes;
        document.getElementById('preparacionCount').textContent = enPreparacion;
        document.getElementById('listosCount').textContent = listos;
        
        const container = document.getElementById('cocinaPedidos');
        
        if (pedidosPendientes.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-check-circle"></i><p>No hay pedidos en cocina</p></div>';
            return;
        }
        
        // Agrupar por estado
        const pedidosPendientesList = pedidosPendientes.filter(p => p.estadoCocina === 'Pendiente');
        const pedidosPreparacionList = pedidosPendientes.filter(p => p.estadoCocina === 'En preparación');
        const pedidosListosList = pedidosPendientes.filter(p => p.estadoCocina === 'Listo');
        
        let html = '';
        
        if (pedidosPendientesList.length > 0) {
            html += this.renderizarSeccion('⏳ Pendientes', pedidosPendientesList);
        }
        
        if (pedidosPreparacionList.length > 0) {
            html += this.renderizarSeccion('🔥 En preparación', pedidosPreparacionList);
        }
        
        if (pedidosListosList.length > 0) {
            html += this.renderizarSeccion('✅ Listos para servir', pedidosListosList);
        }
        
        container.innerHTML = html;
    }
    
    renderizarSeccion(titulo, pedidos) {
        return `
            <div class="seccion-cocina">
                <h3>${titulo}</h3>
                ${pedidos.map(pedido => `
                    <div class="pedido-cocina-card">
                        <div class="pedido-header">
                            <div>
                                <strong>Pedido #${pedido.id.slice(-6)}</strong>
                                <span>Mesa ${pedido.mesa}</span>
                                ${pedido.cliente ? `<span>Cliente: ${pedido.cliente}</span>` : ''}
                                <span>⏱️ Tiempo estimado: ${pedido.tiempoTotal} min</span>
                            </div>
                            <span class="estado-badge estado-${pedido.estadoCocina.toLowerCase().replace(' ', '-')}">
                                ${pedido.estadoCocina}
                            </span>
                        </div>
                        <div class="platos-detalle">
                            <strong>Platos:</strong>
                            <ul>
                                ${pedido.items.map(item => `
                                    <li>
                                        ${item.nombre} 
                                        ${item.modificaciones ? `<br><small class="modificacion-text">✏️ ${item.modificaciones}</small>` : ''}
                                    </li>
                                `).join('')}
                            </ul>
                        </div>
                        ${pedido.observaciones ? `<p><strong>Observaciones generales:</strong> ${pedido.observaciones}</p>` : ''}
                        <div class="item-actions">
                            ${this.renderizarBotones(pedido)}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderizarBotones(pedido) {
        switch(pedido.estadoCocina) {
            case 'Pendiente':
                return `<button onclick="controlCocina.actualizarEstado('${pedido.id}', 'En preparación')" class="btn-primary">
                            <i class="fas fa-play"></i> Iniciar Preparación
                        </button>`;
            case 'En preparación':
                return `<button onclick="controlCocina.actualizarEstado('${pedido.id}', 'Listo')" class="btn-success">
                            <i class="fas fa-check"></i> Marcar como Listo
                        </button>`;
            case 'Listo':
                return `<button disabled class="btn-disabled">
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