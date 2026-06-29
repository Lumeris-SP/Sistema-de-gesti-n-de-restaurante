# MAFFIA - Restaurante Oriental

## 1. Nombre del proyecto

MAFFIA - Restaurante Oriental

---

## 2. Integrantes

- Parhuay Meza Idania Chanara
- Pauccara Huancara Eber
- Santamaria Huaytan Gabriela
- Sihuincha Palacin Lumeris

---

## 3. Caso elegido

Sistema de Gestión de Restaurante.

---

## 4. Descripción del sistema

MAFFIA es un sistema web desarrollado para ayudar en la gestión de un restaurante oriental. Permite administrar usuarios, platos y pedidos de manera rápida y organizada.

El objetivo del sistema es facilitar el trabajo del personal del restaurante, mejorar el control de la información y brindar una mejor atención a los clientes.

---

## 5. Tecnologías usadas

- HTML
- CSS
- JavaScript
- Supabase
- Git
- GitHub

---

## 6. Módulos desarrollados

- Inicio de sesión
- Registro de usuarios
- Gestión de usuarios
- Gestión de platos
- Gestión de pedidos
- Cocina
- Facturación
- Cuenta de usuario

---

## 7. Roles implementados

### Administrador
Puede gestionar usuarios, platos y pedidos.

### Cocina
Puede visualizar y actualizar el estado de los pedidos.

### Usuario
Puede acceder al sistema y realizar las acciones permitidas.

---

## 8. Credenciales de prueba

### Administrador

Correo: __________

Contraseña: __________

### Usuario

Correo: __________

Contraseña: __________

---

## 9. Estructura de tablas

### Tabla: Usuarios

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | Texto |
| correo | Texto |
| rol | Texto |

### Tabla: Platos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | Texto |
| precio | Numérico |
| descripcion | Texto |

### Tabla: Pedidos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| fecha | Fecha |
| estado | Texto |
| total | Numérico |

> Reemplazar por la estructura real de las tablas creadas en Supabase.

---

## 10. Instrucciones para ejecutar

1. Clonar el repositorio desde GitHub.
2. Abrir el proyecto en Visual Studio Code.
3. Configurar la conexión con Supabase.
4. Ejecutar el proyecto.
5. Abrir el sistema desde el navegador.

---

## 11. Capturas del sistema

### Inicio de sesión

(Agregar captura)

### Registro de usuarios

(Agregar captura)

### Gestión de platos

(Agregar captura)

### Gestión de pedidos

(Agregar captura)

### Cocina

(Agregar captura)

---

## 12. División de responsabilidades

| Integrante | Responsabilidad |
|------------|----------------|
| Parhuay Meza Idania Chanara | Desarrollo del sistema |
| Pauccara Huancara Eber | Desarrollo del sistema |
| Santamaria Huaytan Gabriela | Diseño y pruebas |
| Sihuincha Palacin Lumeris | Integración del proyecto y control de versiones |

---

## 13. Problemas encontrados y solución aplicada

### Problema 1

Dificultades para conectar el sistema con Supabase.

**Solución:** Se revisaron las credenciales y la configuración de la conexión hasta lograr una comunicación correcta con la base de datos.

### Problema 2

Conflictos al trabajar en equipo con GitHub.

**Solución:** Se realizaron commits frecuentes y se sincronizó el repositorio antes de subir cambios.

### Problema 3

Errores al actualizar el estado de los pedidos.

**Solución:** Se agregaron validaciones para asegurar que los datos se actualicen correctamente.
