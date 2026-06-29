# MAFFIA - Restaurante Oriental
<img width="560" height="200" alt="image" src="https://github.com/user-attachments/assets/20c5e382-dd21-4974-8f32-033a52dab540" />

## Integrantes

- Parhuay Meza Idania Chanara
- Pauccara Huancara Eber
- Santamaria Huaytan Gabriela
- Sihuincha Palacin Lumeris

## Caso elegido

Sistema de Gestión de Restaurante.

## Descripción del sistema

MAFFIA es un sistema web desarrollado para la gestión de un restaurante oriental. La plataforma permite administrar usuarios, platos, pedidos y procesos de cocina, facilitando la organización de las operaciones del restaurante y mejorando la atención al cliente.

El sistema busca optimizar el control de la información, reducir errores en la gestión de pedidos y brindar una experiencia eficiente para los trabajadores y administradores del restaurante.

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

## Módulos desarrollados

- Inicio de sesión.
- Registro de usuarios.
- Gestión de usuarios.
- Gestión de platos.
- Gestión de pedidos.
- Gestión de cocina.
- Gestión de facturación.
- Gestión de cuenta de usuario.

## Roles implementados

- Administrador.
- Personal de cocina.
- Usuario.

## Credenciales de prueba

> Completar con las credenciales utilizadas en Supabase.

### Administrador
- Correo:
- Contraseña:

### Usuario
- Correo:
- Contraseña:

## Estructura de tablas

> Completar según las tablas creadas en Supabase.

### Usuarios
| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | TEXT |
| correo | TEXT |
| rol | TEXT |

### Platos
| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | TEXT |
| precio | NUMERIC |
| descripcion | TEXT |

### Pedidos
| Campo | Tipo |
|---------|---------|
| id | UUID |
| fecha | TIMESTAMP |
| estado | TEXT |
| total | NUMERIC |

## Instrucciones para ejecutar

### 1. Clonar el repositorio

```bash
git clone URL_DEL_REPOSITORIO
