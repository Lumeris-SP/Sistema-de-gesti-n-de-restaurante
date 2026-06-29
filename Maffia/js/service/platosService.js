// ============================================================
// js/services/platosService.js
// MAFFIA — Acceso a datos: platos
// ============================================================
// Reemplaza el localStorage.getItem('platos') / setItem('platos')
// de platos.js (y la lectura que hacían pedidos.js y cocina.js
// del mismo storage). Ningún otro archivo del proyecto debe
// llamar a window.supabaseClient directamente para hablar de
// platos: todos pasan por este service.
//
// Nota sobre alérgenos: en el modelo anterior, cada plato guardaba
// alergenos: ['Soya', 'Gluten'] como array de strings + un campo
// suelto otroAlergeno. Ahora viven en dos tablas relacionales
// (alergenos, plato_alergenos — ver sql/01_schema.sql). Este
// service se encarga de traducir entre la forma "plana" que usa
// el HTML/formulario (un array de nombres) y la forma relacional
// de la base de datos, para que platos.page.js no tenga que
// preocuparse por esa diferencia.
//
// Requiere que supabaseClient.js se haya cargado antes.
// ============================================================

const PlatosService = {
    // ────────────────────────────────────────────────────────
    // LECTURA
    // ────────────────────────────────────────────────────────

    // Devuelve todos los platos con sus alérgenos ya "aplanados"
    // a un array de nombres, igual que el shape que usaba el
    // proyecto original (para minimizar cambios en el render).
    async listar() {
        const { data, error } = await window.supabaseClient
            .from('platos')
            .select(`
                id, codigo, nombre, descripcion, categoria, precio,
                tiempo_minutos, estado, modificable,
                plato_alergenos ( detalle_otro, alergenos ( nombre ) )
            `)
            .order('codigo', { ascending: true });

        if (error) {
            console.error('[PlatosService] Error listando platos:', error.message);
            return [];
        }

        return data.map(this._aplanar);
    },

    // Solo los activos (lo que consulta pedidos.js para construir
    // el formulario de toma de pedido).
    async listarActivos() {
        const todos = await this.listar();
        return todos.filter((p) => p.estado === 'Activo');
    },

    async obtenerPorId(id) {
        const { data, error } = await window.supabaseClient
            .from('platos')
            .select(`
                id, codigo, nombre, descripcion, categoria, precio,
                tiempo_minutos, estado, modificable,
                plato_alergenos ( detalle_otro, alergenos ( nombre ) )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[PlatosService] Error obteniendo plato:', error.message);
            return null;
        }
        return this._aplanar(data);
    },

    async obtenerCatalogoAlergenos() {
        const { data, error } = await window.supabaseClient
            .from('alergenos')
            .select('id, nombre')
            .order('id');

        if (error) {
            console.error('[PlatosService] Error obteniendo catálogo de alérgenos:', error.message);
            return [];
        }
        return data;
    },

    // ────────────────────────────────────────────────────────
    // ESCRITURA
    // ────────────────────────────────────────────────────────

    // datos = { codigo, nombre, descripcion, categoria, precio,
    //           tiempoMinutos, estado, modificable, alergenos: [...nombres],
    //           otroAlergeno: 'texto si aplica' }
    // Devuelve { ok, plato } o { ok: false, mensaje }.
    async crear(datos) {
        const errores = this._validar(datos);
        if (Object.keys(errores).length > 0) {
            return { ok: false, errores };
        }

        const { data: plato, error } = await window.supabaseClient
            .from('platos')
            .insert({
                codigo: datos.codigo,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                categoria: datos.categoria,
                precio: datos.precio,
                tiempo_minutos: datos.tiempoMinutos,
                estado: datos.estado,
                modificable: datos.modificable,
            })
            .select()
            .single();

        if (error) {
            // El código duplicado lo rechaza la restricción UNIQUE de
            // la tabla — antes esto se validaba "a mano" recorriendo
            // el array en memoria.
            if (error.code === '23505') {
                return { ok: false, errores: { codigo: 'El código ya existe' } };
            }
            console.error('[PlatosService] Error creando plato:', error.message);
            return { ok: false, mensaje: error.message };
        }

        await this._guardarAlergenos(plato.id, datos.alergenos, datos.otroAlergeno);
        return { ok: true, plato: await this.obtenerPorId(plato.id) };
    },

    async actualizar(id, datos) {
        const errores = this._validar(datos, id);
        if (Object.keys(errores).length > 0) {
            return { ok: false, errores };
        }

        const { error } = await window.supabaseClient
            .from('platos')
            .update({
                codigo: datos.codigo,
                nombre: datos.nombre,
                descripcion: datos.descripcion,
                categoria: datos.categoria,
                precio: datos.precio,
                tiempo_minutos: datos.tiempoMinutos,
                estado: datos.estado,
                modificable: datos.modificable,
            })
            .eq('id', id);

        if (error) {
            if (error.code === '23505') {
                return { ok: false, errores: { codigo: 'El código ya existe' } };
            }
            console.error('[PlatosService] Error actualizando plato:', error.message);
            return { ok: false, mensaje: error.message };
        }

        // Reemplazar alérgenos: borrar los anteriores e insertar los nuevos.
        await window.supabaseClient.from('plato_alergenos').delete().eq('plato_id', id);
        await this._guardarAlergenos(id, datos.alergenos, datos.otroAlergeno);

        return { ok: true, plato: await this.obtenerPorId(id) };
    },

    // Antes de eliminar, platos.js revisaba a mano en localStorage
    // si algún pedido no cancelado usaba ese plato. Ahora esa misma
    // verificación se hace contra pedido_items.
    async eliminar(id) {
        const { count, error: errorConteo } = await window.supabaseClient
            .from('pedido_items')
            .select('id, pedidos!inner(estado)', { count: 'exact', head: true })
            .eq('plato_id', id)
            .neq('pedidos.estado', 'cancelado');

        if (errorConteo) {
            console.error('[PlatosService] Error verificando uso del plato:', errorConteo.message);
            return { ok: false, mensaje: errorConteo.message };
        }

        if (count && count > 0) {
            return { ok: false, mensaje: 'No se puede eliminar el plato porque tiene pedidos asociados' };
        }

        const { error } = await window.supabaseClient.from('platos').delete().eq('id', id);
        if (error) {
            console.error('[PlatosService] Error eliminando plato:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true };
    },

    async cambiarEstado(id, estadoActual) {
        const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';
        const { error } = await window.supabaseClient
            .from('platos')
            .update({ estado: nuevoEstado })
            .eq('id', id);

        if (error) {
            console.error('[PlatosService] Error cambiando estado del plato:', error.message);
            return { ok: false, mensaje: error.message };
        }
        return { ok: true, nuevoEstado };
    },

    // ────────────────────────────────────────────────────────
    // VALIDACIÓN
    // (mismas reglas que tenía GestionPlatos.validarPlato en el
    // platos.js original, ahora reutilizables fuera del DOM)
    // ────────────────────────────────────────────────────────

    _validar(datos) {
        const errores = {};

        if (!datos.codigo) {
            errores.codigo = 'El código es obligatorio';
        } else if (datos.codigo.length < 3) {
            errores.codigo = 'Mínimo 3 caracteres';
        } else if (datos.codigo !== datos.codigo.trim()) {
            errores.codigo = 'No debe tener espacios al inicio o final';
        }

        if (!datos.nombre) {
            errores.nombre = 'El nombre es obligatorio';
        } else if (datos.nombre.length < 3 || datos.nombre.length > 60) {
            errores.nombre = 'Debe tener entre 3 y 60 caracteres';
        } else if (/^\d+$/.test(datos.nombre)) {
            errores.nombre = 'No puede ser solo números';
        }

        if (!datos.descripcion) {
            errores.descripcion = 'La descripción es obligatoria';
        } else if (datos.descripcion.length < 10 || datos.descripcion.length > 250) {
            errores.descripcion = 'Debe tener entre 10 y 250 caracteres';
        }

        if (!datos.categoria) errores.categoria = 'Seleccione una categoría';

        if (!datos.precio) {
            errores.precio = 'El precio es obligatorio';
        } else if (isNaN(datos.precio) || datos.precio <= 0 || datos.precio > 500) {
            errores.precio = 'El precio debe estar entre 0 y S/ 500';
        }

        if (!datos.tiempoMinutos) {
            errores.tiempo = 'El tiempo es obligatorio';
        } else if (isNaN(datos.tiempoMinutos) || datos.tiempoMinutos <= 0 || datos.tiempoMinutos > 120) {
            errores.tiempo = 'El tiempo debe estar entre 1 y 120 minutos';
        }

        if (!datos.estado) errores.estado = 'Seleccione un estado';

        if (!datos.alergenos || datos.alergenos.length === 0) {
            errores.alergenos = 'Seleccione al menos un alérgeno';
        } else if (datos.alergenos.includes('Otro') && !datos.otroAlergeno) {
            errores.alergenos = 'Especifique el otro alérgeno';
        }

        if (!datos.modificable) {
            errores.modificable = 'Este campo es obligatorio';
        } else if (datos.modificable.length > 200) {
            errores.modificable = 'Máximo 200 caracteres';
        }

        return errores;
    },

    // ────────────────────────────────────────────────────────
    // INTERNOS
    // ────────────────────────────────────────────────────────

    // Convierte la fila anidada que devuelve Supabase
    // (plato_alergenos -> alergenos.nombre) a la forma plana
    // { ...plato, alergenos: ['Gluten', 'Otro'], otroAlergeno: '...' }
    // Si el plato no tiene alérgenos registrados, devuelve ['Ninguno']
    // para mantener coherencia con el checkbox de la UI.
    _aplanar(fila) {
        const relaciones = fila.plato_alergenos || [];
        // Excluir 'Ninguno' de las filas reales (no debería estar, pero
        // lo filtramos por si alguien lo insertó manualmente).
        const sinNinguno = relaciones.filter((r) => r.alergenos.nombre !== 'Ninguno');
        const alergenos = sinNinguno.length > 0
            ? sinNinguno.map((r) => r.alergenos.nombre)
            : ['Ninguno'];
        const otro = sinNinguno.find((r) => r.alergenos.nombre === 'Otro');

        return {
            id: fila.id,
            codigo: fila.codigo,
            nombre: fila.nombre,
            descripcion: fila.descripcion,
            categoria: fila.categoria,
            precio: fila.precio,
            tiempoMinutos: fila.tiempo_minutos,
            estado: fila.estado,
            modificable: fila.modificable,
            alergenos,
            otroAlergeno: otro ? otro.detalle_otro || '' : '',
        };
    },

    async _guardarAlergenos(platoId, nombresAlergenos, otroAlergeno) {
        if (!nombresAlergenos || nombresAlergenos.length === 0) return;

        // 'Ninguno' es una opción de UI que significa "sin alérgenos": no
        // genera filas en plato_alergenos (no hay nada que relacionar).
        const aGuardar = nombresAlergenos.filter((n) => n !== 'Ninguno');
        if (aGuardar.length === 0) return;

        const catalogo = await this.obtenerCatalogoAlergenos();
        const filas = aGuardar
            .map((nombre) => {
                const match = catalogo.find((a) => a.nombre === nombre);
                if (!match) {
                    console.warn(`[PlatosService] Alérgeno desconocido ignorado: "${nombre}"`);
                    return null;
                }
                return {
                    plato_id: platoId,
                    alergeno_id: match.id,
                    detalle_otro: nombre === 'Otro' ? otroAlergeno || '' : null,
                };
            })
            .filter(Boolean);

        if (filas.length === 0) return;

        const { error } = await window.supabaseClient.from('plato_alergenos').insert(filas);
        if (error) {
            console.error('[PlatosService] Error guardando alérgenos:', error.message);
        }
    },
};
