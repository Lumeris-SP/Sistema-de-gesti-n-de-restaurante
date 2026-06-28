    // ============================================================
// js/core/supabaseClient.js
// MAFFIA — Cliente único de Supabase
// ============================================================
// Este es el ÚNICO archivo del proyecto que conoce la URL y la
// key de Supabase. Antes (pedidos.js) estas credenciales estaban
// hardcodeadas dentro de un módulo de negocio, mezcladas con la
// lógica de pedidos. Ahora viven en un solo lugar, y cualquier
// otro script que necesite hablar con Supabase usa el objeto
// global `window.supabaseClient` que este archivo crea.
//
// IMPORTANTE sobre la "anon key": es pública por diseño (vive en
// el navegador, cualquiera puede verla con F12). Eso es seguro
// SOLO si las políticas RLS (sql/02_rls_policies.sql) están
// activas en tu proyecto de Supabase. Sin RLS, esta key da acceso
// total de lectura/escritura a quien sea.
//
// Cómo se carga: este script debe ir SIEMPRE primero, antes de
// cualquier otro script de la app, en cada HTML:
//
//   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js"></script>
//   <script src="../js/core/supabaseClient.js"></script>
//   <script src="../js/core/auth.js"></script>
//   ... (services, luego page.js)
// ============================================================

(function () {
    'use strict';

    // TODO: reemplazar con los valores reales de tu proyecto nuevo
    // de Supabase (Project Settings -> API -> Project URL / anon public key).
    const SUPABASE_URL = 'https://pvqzvgvyjbpeujwrizxv.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB2cXp2Z3Z5amJwZXVqd3Jpenh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI0MzUyMjUsImV4cCI6MjA5ODAxMTIyNX0.RANh4M39i15o0Tcysoo7TEcim8kGg9Eh2ak9tE3A1II';

    if (typeof window.supabase === 'undefined') {
        console.error(
            '[supabaseClient] No se encontró la librería supabase-js. ' +
            'Verifica que el <script> del CDN de supabase-js esté cargado ' +
            'ANTES de supabaseClient.js en este HTML.'
        );
        return;
    }

    if (SUPABASE_URL.includes('TU-PROYECTO') || SUPABASE_ANON_KEY.includes('TU-ANON-KEY')) {
        console.warn(
            '[supabaseClient] Todavía tienes los valores de ejemplo. ' +
            'Reemplaza SUPABASE_URL y SUPABASE_ANON_KEY con los de tu proyecto real.'
        );
    }

    // createClient viene del UMD global que carga el <script> del CDN
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            // Persiste la sesión en localStorage del navegador entre
            // recargas de página — esto es manejado internamente por
            // supabase-js, no es lo mismo que el localStorage manual
            // que usaba el proyecto antes para simular la "BD".
            persistSession: true,
            autoRefreshToken: true,
        },
    });
})();