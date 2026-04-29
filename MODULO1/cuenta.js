// cuenta.js - Generación de cuenta final
class GenerarCuenta {
    constructor() {
        this.pedidos = [];
        this.init();
    }

    init() {
        this.cargarDatos();
        this.registrarEventos();
        this.actualizarVista();
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
        window.addEventListener('storage', (e) => {
            if (e.key === 'pedidos') {
                this.cargarDatos();
                this.actualizarVista();
            }
        });
    }

    generarCuenta(pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        
        if (!pedido) {
            alert('Pedido no encontrado');
            return;
        }
        
        if (pedido.estadoCocina !== 'Listo') {
            alert('El pedido debe estar listo antes de generar la cuenta');
            return;
        }
        
        // Calcular detalles de la cuenta
        const subtotal = pedido.total;
        const igv = subtotal * 0.18;
        const total = subtotal + igv;
        
        const cuentaHTML = `
            <div class="factura-modal">
                <div class="factura-content">
                    <div class="factura-header">
                        <i class="fas fa-dragon"></i>
                        <h2>WALOK RESTAURANTE ORIENTAL</h2>
                        <p>Av. Angamos Oeste 700</p>
                        <p>RUC: 20601234567</p>
                        <hr>
                    </div>
                    <div class="factura-body">
                        <p><strong>Comprobante N°:</strong> F001-${pedido.id.slice(-8)}</p>
                        <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
                        <p><strong>Mesa:</strong> ${pedido.mesa}</p>
                        ${pedido.cliente ? `<p><strong>Cliente:</strong> ${pedido.cliente}</p>` : ''}
                        <hr>
                        <table class="factura-tabla">
                            <thead>
                                <tr><th>Descripción</th><th>Precio</th></tr>
                            </thead>
                            <tbody>
                                ${pedido.items.map(item => `
                                    <tr>
                                        <td>${item.nombre} ${item.modificaciones ? `<br><small>${item.modificaciones}</small>` : ''}</td>
                                        <td>S/ ${item.precio.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                            <tfoot>
                                <tr><td><strong>Subtotal</strong></td><td>S/ ${subtotal.toFixed(2)}</td></tr>
                                <tr><td><strong>IGV (18%)</strong></td><td>S/ ${igv.toFixed(2)}</td></tr>
                                <tr class="total-row"><td><strong>TOTAL</strong></td><td><strong>S/ ${total.toFixed(2)}</strong></td></tr>
                            </tfoot>
                        </table>
                        <p class="factura-nota">* Este comprobante no es válido como factura fiscal</p>
                    </div>
                    <div class="factura-footer">
                        <p>¡Gracias por su visita!</p>
                        <p>Horario: Lun-Sáb 12:00-21:30 | Dom 12:00-20:30</p>
                    </div>
                </div>
            </div>
        `;
        
        // Mostrar factura en una ventana modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = cuentaHTML + `
            <div class="modal-buttons">
                <button onclick="this.closest('.modal-overlay').remove()" class="btn-secondary">Cerrar</button>
                <button onclick="window.print()" class="btn-primary"><i class="fas fa-print"></i> Imprimir</button>
                <button id="confirmarPago" class="btn-success"><i class="fas fa-check"></i> Confirmar Pago</button>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        document.getElementById('confirmarPago').addEventListener('click', () => {
            this.confirmarPago(pedidoId);
            modal.remove();
        });
    }
    
    confirmarPago(pedidoId) {
        const pedido = this.pedidos.find(p => p.id === pedidoId);
        if (pedido) {
            pedido.estado = 'Pagado';
            pedido.fechaPago = new Date().toLocaleString();
            this.guardarPedidos();
            alert(`Pago confirmado. Total: S/ ${(pedido.total * 1.18).toFixed(2)}`);
        }
    }

    actualizarVista() {
        const pedidosListos = this.pedidos.filter(p => p.estadoCocina === 'Listo' && p.estado !== 'Pagado');
        const container = document.getElementById('pedidosListos');
        
        if (pedidosListos.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-receipt"></i><p>No hay pedidos listos para facturar</p></div>';
            return;
        }
        
        container.innerHTML = `
            <div class="facturar-container">
                <h2>Pedidos listos para facturar</h2>
                ${pedidosListos.map(pedido => `
                    <div class="item-card facturar-card">
                        <div class="item-header">
                            <div>
                                <h3>Mesa ${pedido.mesa} - Pedido #${pedido.id.slice(-6)}</h3>
                                <small>${pedido.fecha}</small>
                                ${pedido.cliente ? `<small>Cliente: ${pedido.cliente}</small>` : ''}
                            </div>
                            <span class="item-badge">✅ Listo</span>
                        </div>
                        <div class="pedido-resumen">
                            <p><strong>Items:</strong> ${pedido.items.length} platos</p>
                            <p><strong>Subtotal:</strong> S/ ${pedido.total.toFixed(2)}</p>
                            <p><strong>Total + IGV:</strong> S/ ${(pedido.total * 1.18).toFixed(2)}</p>
                        </div>
                        <div class="item-actions">
                            <button onclick="generarCuenta.generarCuenta('${pedido.id}')" class="btn-primary">
                                <i class="fas fa-receipt"></i> Generar Cuenta
                            </button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

let generarCuenta;
document.addEventListener('DOMContentLoaded', () => {
    generarCuenta = new GenerarCuenta();
});