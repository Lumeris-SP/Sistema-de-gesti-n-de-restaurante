# MAFFIA - Restaurante Oriental

<p align="center">
  <img width="560" height="200" alt="MAFFIA" src="https://github.com/user-attachments/assets/20c5e382-dd21-4974-8f32-033a52dab540" />
</p>

---

## Integrantes

<p align="center">
  <img width="315" height="315" alt="Integrantes" src="https://github.com/user-attachments/assets/a6a65649-c80b-4745-b5f6-4ba21d8a2fb6" />
</p>

### Tabla de integrantes y responsabilidades

| Foto | Nombre | Responsabilidad |
|------|--------|----------------|
| <img width="80" src="URL_FOTO_IDANIA"> | Parhuay Meza Idania Chanara | Desarrollo Frontend / UI |
| <img width="80" src="URL_FOTO_EBER"> | Pauccara Huancara Eber | Base de datos / Supabase |
| <img width="80" src="URL_FOTO_GABRIELA"> | Santamaria Huaytan Gabriela | Gestión de pedidos / lógica del sistema |
| <img width="80" src="URL_FOTO_LUMERIS"> | Sihuincha Palacin Lumeris | Coordinación general / documentación / GitHub |

---

## Caso elegido

Sistema de Gestión de Restaurante.

---

## Descripción del sistema

MAFFIA es un sistema web desarrollado para la gestión de un restaurante oriental. La plataforma permite administrar usuarios, platos, pedidos y procesos de cocina, facilitando la organización de las operaciones del restaurante y mejorando la atención al cliente.

El sistema busca optimizar el control de la información, reducir errores en la gestión de pedidos y brindar una experiencia eficiente para los trabajadores y administradores del restaurante.

---

## Tecnologías usadas

### Frontend
- HTML5
- CSS3
- JavaScript

### Base de Datos y Servicios
- Supabase

### Control de Versiones
- Git
- GitHub

---

## Módulos desarrollados

- Inicio de sesión
- Registro de usuarios
- Gestión de usuarios
- Gestión de platos
- Gestión de pedidos
- Gestión de cocina
- Gestión de facturación
- Gestión de cuenta de usuario

---

## Roles implementados

- Administrador
- Personal de cocina
- Usuario

---

## Credenciales de prueba

> Completar con las credenciales utilizadas en Supabase.

### Administrador
- Correo:
- Contraseña:

### Usuario
- Correo:
- Contraseña:

---

## Estructura de tablas

### Usuarios
| Campo | Tipo |
|------|------|
| id | UUID |
| nombre | TEXT |
| correo | TEXT |
| rol | TEXT |

---

### Platos
| Campo | Tipo |
|------|------|
| id | UUID |
| nombre | TEXT |
| precio | NUMERIC |
| descripcion | TEXT |

---

### Pedidos
| Campo | Tipo |
|------|------|
| id | UUID |
| fecha | TIMESTAMP |
| estado | TEXT |
| total | NUMERIC |

---

## Instrucciones para ejecutar

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
