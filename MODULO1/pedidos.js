// pedidos.js - Gestión de pedidos por mesa
class GestionPedidos {
    constructor() {
        this.pedidos = [];
        this.platos = [];
        this.init();
    }

    init() {
        this.cargarDatos();
        this.registrarEventos();
        this.actualizarListado();
        this.cargarPlatosDisponibles();
    }

    cargarDatos() {
        this.pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        this.platos = JSON.parse(localStorage.getItem('platos')) || [];
    }

    guardarPedidos() {
        localStorage.setItem('pedidos', JSON.stringify(this.pedidos));
        this.actualizarListado();
        this.actualizarDashboard();
    }

    actualizarDashboard() {
        // Disparar evento para actualizar dashboard
        window.dispatchEvent(new StorageEvent('storage', { key: 'pedidos' }));
    }

    registrarEventos() {
        document.getElementById('pedidoForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.crearPedido();
        });
    }

    cargarPlatosDisponibles() {
        const platosActivos = this.platos.filter(p => p.estado === 'Activo');
        const container = document.getElementById('platosDisponibles');
        
        if (platosActivos.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>No hay platos activos disponibles. Registre platos en el módulo correspondiente.</p></div>';
            return;
        }
        
        container.innerHTML = platosActivos.map(plato => `
            <div class="plato-selector-item">
                <label>
                    <input type="checkbox" class="plato-checkbox" data-id="${plato.id}" data-precio="${plato.precio}" data-nombre="${plato.nombre}" data-tiempo="${plato.tiempo}">
                    <div class="plato-info">
                        <strong>${plato.nombre}</strong>
                        <span>S/ ${plato.precio.toFixed(2)}</span>
                        <small>${plato.tiempo} min</small>
                        ${plato.alergenos.length > 0 && !plato.alergenos.includes('Ninguno') ? `<small class="alergenos-label">⚠️ ${plato.alergenos.join(', ')}</small>` : ''}
                    </div>
                </label>
                <div class="modificacion-item" style="display:none; margin-top:5px; margin-left:25px;">
                    <input type="text" class="modificacion-input" placeholder="Modificaciones específicas para este plato">
                </div>
            </div>
        `).join('');
        
        // Agregar evento para mostrar campo de modificación
        document.querySelectorAll('.plato-checkbox').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const modificacionDiv = e.target.closest('.plato-selector-item').querySelector('.modificacion-item');
                if (modificacionDiv) {
                    modificacionDiv.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        });
    }

    validarPedido(mesa, items) {
        const errores = {};
        
        if (!mesa || mesa <= 0) {
            errores.mesa = 'Número de mesa válido requerido';
        }
        
        if (items.length === 0) {
            errores.platos = 'Seleccione al menos un plato';
        }
        
        return errores;
    }

    mostrarErrores(errores) {
        for (const [campo, mensaje] of Object.entries(errores)) {
            const errorSpan = document.getElementById(`${campo}Error`);
            if (errorSpan) errorSpan.textContent = mensaje;
        }
    }

    limpiarErrores() {
        const errorSpans = document.querySelectorAll('.error-message');
        errorSpans.forEach(span => span.textContent = '');
    }

    crearPedido() {
        const mesa = parseInt(document.getElementById('mesa').value);
        const cliente = document.getElementById('cliente').value.trim();
        const observaciones = document.getElementById('observaciones').value.trim();
        
        const items = [];
        const checkboxes = document.querySelectorAll('.plato-checkbox:checked');
        
        checkboxes.forEach(cb => {
            const platoId = cb.dataset.id;
            const platoOriginal = this.platos.find(p => p.id === platoId);
            const modificacionDiv = cb.closest('.plato-selector-item').querySelector('.modificacion-input');
            const modificaciones = modificacionDiv ? modificacionDiv.value.trim() : '';
            
            items.push({
                platoId: platoId,
                nombre: cb.dataset.nombre,
                precio: parseFloat(cb.dataset.precio),
                tiempo: parseInt(cb.dataset.tiempo),
                modificaciones: modificaciones || observaciones
            });
        });
        
        const errores = this.validarPedido(mesa, items);
        
        if (Object.keys(errores).length > 0) {
            this.mostrarErrores(errores);
            return;
        }
        
        const nuevoPedido = {
            id: Date.now().toString(),
            mesa: mesa,
            cliente: cliente,
            fecha: new Date().toLocaleString(),
            items: items,
            observaciones: observaciones,
            estado: 'Activo',
            estadoCocina: 'Pendiente',
            total: items.reduce((sum, item) => sum + item.precio, 0),
            tiempoTotal: Math.max(...items.map(i => i.tiempo))
        };
        
        this.pedidos.push(nuevoPedido);
        this.guardarPedidos();
        
        alert(`Pedido #${nuevoPedido.id.slice(-6)} creado exitosamente. Total: S/ ${nuevoPedido.total.toFixed(2)}`);
        
        document.getElementById('pedidoForm').reset();
        this.limpiarErrores();
        
        // Limpiar checkboxes
        document.querySelectorAll('.plato-checkbox').forEach(cb => {
            cb.checked = false;
            const modificacionDiv = cb.closest('.plato-selector-item').querySelector('.modificacion-item');
            if (modificacionDiv) modificacionDiv.style.display = 'none';
        });
    }

    cancelarPedido(id) {
        if (confirm('¿Está seguro de cancelar este pedido?')) {
            this.pedidos = this.pedidos.filter(p => p.id !== id);
            this.guardarPedidos();
            alert('Pedido cancelado');
        }
    }

    actualizarListado() {
        const pedidosActivos = this.pedidos.filter(p => p.estado !== 'Pagado');
        const container = document.getElementById('pedidosList');
        
        if (pedidosActivos.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-clipboard-list"></i><p>No hay pedidos activos</p></div>';
            return;
        }
        
        container.innerHTML = pedidosActivos.map(pedido => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <h3>Pedido #${pedido.id.slice(-6)}</h3>
                        <small>Mesa ${pedido.mesa} | ${pedido.fecha}</small>
                        ${pedido.cliente ? `<small>Cliente: ${pedido.cliente}</small>` : ''}
                    </div>
                    <span class="item-badge estado-${pedido.estadoCocina.toLowerCase().replace(' ', '-')}">
                        ${this.getEstadoIcon(pedido.estadoCocina)} ${pedido.estadoCocina}
                    </span>
                </div>
                <div class="pedido-items">
                    <strong>Platos:</strong>
                    <ul>
                        ${pedido.items.map(item => `
                            <li>${item.nombre} - S/ ${item.precio.toFixed(2)} 
                                ${item.modificaciones ? `<br><small class="modificacion-text">✏️ ${item.modificaciones}</small>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
                <p><strong>Total:</strong> S/ ${pedido.total.toFixed(2)}</p>
                ${pedido.observaciones ? `<p><strong>Observaciones:</strong> ${pedido.observaciones}</p>` : ''}
                <div class="item-actions">
                    <button onclick="gestionPedidos.cancelarPedido('${pedido.id}')" class="btn-danger">
                        <i class="fas fa-times"></i> Cancelar Pedido
                    </button>
                </div>
            </div>
        `).join('');
    }
    
    getEstadoIcon(estado) {
        switch(estado) {
            case 'Pendiente': return '⏳';
            case 'En preparación': return '🔥';
            case 'Listo': return '✅';
            default: return '❓';
        }
    }
}

let gestionPedidos;
document.addEventListener('DOMContentLoaded', () => {
    gestionPedidos = new GestionPedidos();
});