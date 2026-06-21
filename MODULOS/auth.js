const Auth = {
    ROLES: {
        CLIENTE: 'Cliente',
        MOZO: 'Mozo',
        COCINA: 'Cocina',
        CAJA: 'Caja',
        ADMINISTRADOR: 'Administrador'
    },

    PERMISOS: {
        Cliente: ['ver_menu', 'hacer_pedidos', 'ver_historial_propio'],
        Mozo: ['ver_pedidos', 'cambiar_estado_pedido', 'asignar_mesa', 'ver_menu'],
        Cocina: ['ver_pedidos_cocina', 'marcar_preparado'],
        Caja: ['ver_facturacion', 'generar_factura', 'cerrar_cuenta'],
        Administrador: [
            'gestionar_usuarios', 'gestionar_productos', 'gestionar_pedidos',
            'ver_reportes', 'ver_ventas', 'ver_pedidos', 'cambiar_estado_pedido',
            'asignar_mesa', 'ver_pedidos_cocina', 'marcar_preparado',
            'ver_facturacion', 'generar_factura', 'cerrar_cuenta', 'ver_menu'
        ]
    },

    getSesion: function () {
        var s = localStorage.getItem('maffia_sesion');
        return s ? JSON.parse(s) : null;
    },

    setSesion: function (usuario) {
        localStorage.setItem('maffia_sesion', JSON.stringify({
            id: usuario.id,
            nombre: usuario.nombre,
            apellidos: usuario.apellidos,
            correo: usuario.correo,
            rol: usuario.rol,
            loginTime: Date.now()
        }));
    },

    cerrarSesion: function () {
        localStorage.removeItem('maffia_sesion');
        window.location.href = 'login.html';
    },

    estaAutenticado: function () {
        return this.getSesion() !== null;
    },

    getRol: function () {
        var s = this.getSesion();
        return s ? s.rol : null;
    },

    tienePermiso: function (permiso) {
        var rol = this.getRol();
        if (!rol) return false;
        var lista = this.PERMISOS[rol] || [];
        return lista.indexOf(permiso) !== -1;
    },

    proteger: function (rolesPermitidos) {
        rolesPermitidos = rolesPermitidos || [];
        if (!this.estaAutenticado()) {
            window.location.href = 'login.html';
            return false;
        }
        if (rolesPermitidos.length > 0 && rolesPermitidos.indexOf(this.getRol()) === -1) {
            alert('No tienes permiso para acceder a esta seccion.');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    },

    getUsuarios: function () {
        var data = localStorage.getItem('maffia_usuarios');
        return data ? JSON.parse(data) : [];
    },

    setUsuarios: function (usuarios) {
        localStorage.setItem('maffia_usuarios', JSON.stringify(usuarios));
    },

    buscarPorCorreo: function (correo) {
        var usuarios = this.getUsuarios();
        var correoBuscado = correo.toLowerCase();
        for (var i = 0; i < usuarios.length; i++) {
            if (usuarios[i].correo.toLowerCase() === correoBuscado) {
                return usuarios[i];
            }
        }
        return null;
    },

    inicializarDatos: function () {
        var usuarios = this.getUsuarios();
        if (usuarios.length === 0) {
            this.setUsuarios([
                {
                    id: 1,
                    nombre: 'Admin',
                    apellidos: 'MAFFIA',
                    correo: 'admin@maffia.com',
                    celular: '999000001',
                    contrasena: btoa('admin123'),
                    rol: 'Administrador',
                    estado: 'Activo',
                    fechaRegistro: new Date().toISOString()
                },
                {
                    id: 2,
                    nombre: 'Carlos',
                    apellidos: 'Mozo',
                    correo: 'mozo@maffia.com',
                    celular: '999000002',
                    contrasena: btoa('mozo123'),
                    rol: 'Mozo',
                    estado: 'Activo',
                    fechaRegistro: new Date().toISOString()
                },
                {
                    id: 3,
                    nombre: 'Ana',
                    apellidos: 'Chef',
                    correo: 'cocina@maffia.com',
                    celular: '999000003',
                    contrasena: btoa('cocina123'),
                    rol: 'Cocina',
                    estado: 'Activo',
                    fechaRegistro: new Date().toISOString()
                },
                {
                    id: 4,
                    nombre: 'Luis',
                    apellidos: 'Caja',
                    correo: 'caja@maffia.com',
                    celular: '999000004',
                    contrasena: btoa('caja123'),
                    rol: 'Caja',
                    estado: 'Activo',
                    fechaRegistro: new Date().toISOString()
                }
            ]);
        }
    }
};

Auth.inicializarDatos();