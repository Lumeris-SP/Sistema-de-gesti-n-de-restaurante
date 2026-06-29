// ============================================================
// js/pages/index.page.js
// MAFFIA — Página de inicio / dashboard
// ============================================================
// Reemplaza dos archivos del proyecto original:
//   1) El <script> inline que vivía dentro de index.html y hacía
//      el guard de sesión a mano (if (!Auth.estaAutenticado())...).
//      Sacarlo a un archivo aparte evita JS embebido en el HTML
//      y permite que el guard use la API async nueva de Auth sin
//      ensuciar el documento.
//   2) app.js (el dashboard de estadísticas), que leía
//      directamente de localStorage ('platos', 'pedidos'). Ahora
//      lee de PlatosService / PedidosService, que ya hablan con
//      Supabase.
//
// Requiere, en este orden, antes de este script:
//   <script src=".../supabase-js@2/dist/umd/supabase.js"></script>
//   <script src="../js/core/supabaseClient.js"></script>
//   <script src="../js/core/auth.js"></script>
//   <script src="../js/service/platosService.js"></script>
//   <script src="../js/service/pedidosService.js"></script>
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // ── Guard de sesión ──
    // No usamos Auth.proteger() aquí porque esta página es el
    // home común a todos los roles (no hay una lista fija de
    // roles permitidos): solo exige estar autenticado.
    const autenticado = await Auth.estaAutenticado();
    if (!autenticado) {
        window.location.href = 'login.html';
        return;
    }

    const perfil = await Auth.getPerfil();
    if (!perfil) {
        // Sesión válida en Supabase Auth pero sin perfil de negocio
        // (caso raro: el trigger de sql/03_auth_trigger.sql falló).
        // Tratamos como no autenticado, igual que Auth.proteger().
        await Auth.cerrarSesion();
        return;
    }

    // ── Rellenar barra de usuario ──
    document.getElementById('userName').textContent = `${perfil.nombre} ${perfil.apellidos || ''}`;
    document.getElementById('userRol').textContent = perfil.rol;
    document.getElementById('userAvatar').textContent = (perfil.nombre || '?')[0].toUpperCase();

    // ── Mostrar solo las tarjetas de navegación permitidas para el rol ──
    document.querySelectorAll('.nav-card[data-roles]').forEach((card) => {
        const rolesPermitidos = card.getAttribute('data-roles').split(',');
        card.style.display = rolesPermitidos.includes(perfil.rol) ? 'block' : 'none';
    });

    // ── Botón de cerrar sesión ──
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', () => Auth.cerrarSesion());
    }

    // ── Estadísticas del dashboard ──
    await actualizarEstadisticas();
});

async function actualizarEstadisticas() {
    const [platos, pedidos] = await Promise.all([
        PlatosService.listarActivos(),
        PedidosService.listarActivos(),
    ]);

    const pedidosActivos = pedidos.length; // listarActivos() ya excluye pagado/cancelado
    const enCocina = pedidos.filter(
        (p) => p.estadoCocina === 'Pendiente' || p.estadoCocina === 'En preparación'
    ).length;
    const listos = pedidos.filter((p) => p.estadoCocina === 'Listo').length;

    document.getElementById('totalPlatos').textContent = platos.length;
    document.getElementById('totalPedidos').textContent = pedidosActivos;
    document.getElementById('enCocina').textContent = enCocina;
    document.getElementById('listos').textContent = listos;
}
