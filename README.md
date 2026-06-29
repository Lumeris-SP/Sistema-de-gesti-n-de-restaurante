# MAFFIA - Restaurante Oriental

<p align="center">
  <img width="553" height="207" alt="MAFFIA" src="https://github.com/user-attachments/assets/b02df3c2-8b8a-4710-9766-dbda311f228a" />
</p>

---

## Integrantes

<p align="center">
  <img width="315" height="315" alt="Integrantes" src="https://github.com/user-attachments/assets/a6a65649-c80b-4745-b5f6-4ba21d8a2fb6" />
</p>

---

### Tabla de integrantes y responsabilidades

| Foto | Nombre | Responsabilidad |
|------|--------|----------------|
| <img src="https://github.com/user-attachments/assets/aaa1ac7b-968f-4ae6-8205-6e53d156920b" width="120" height="120" style="object-fit:cover; border-radius:10px;"> | Parhuay Meza Idania Chanara | Desarrollo Frontend / UI |
| <img src="https://github.com/user-attachments/assets/84836290-fd1c-42cb-beed-52d0d746b3e4" width="120" height="120" style="object-fit:cover; border-radius:10px;"> | Pauccara Huancara Eber | Base de datos / Supabase |
| <img src="https://github.com/user-attachments/assets/ce638641-96d3-4613-89a7-f40e63da9526" width="120" height="120" style="object-fit:cover; border-radius:10px;"> | Santamaria Huaytan Gabriela | Gestión de pedidos / lógica del sistema |
| <img src="https://github.com/user-attachments/assets/b5a16ac0-13af-46d9-94c1-1313e5844c38" width="120" height="120" style="object-fit:cover; border-radius:10px;"> | Sihuincha Palacin Lumeris | Coordinación general / documentación / GitHub |

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
