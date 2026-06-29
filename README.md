# MAFFIA - Restaurante Oriental

<p align="center">
  <img src="assets/logo_maffia.png" alt="MAFFIA Restaurante Oriental" width="700">
</p>

## 1. Nombre del proyecto

**MAFFIA - Restaurante Oriental**

Sistema de Gestión de Restaurante Oriental.

---

## 2. Integrantes

<p align="center">
  <img src="assets/equipo_maffia.jpeg" alt="Equipo MAFFIA" width="450">
</p>

- Parhuay Meza Idania Chanara
- Pauccara Huancara Eber
- Santamaria Huaytan Gabriela
- Sihuincha Palacin Lumeris

---

## 3. Caso elegido

Sistema de Gestión de Restaurante.

---

## 4. Descripción del sistema

MAFFIA es un sistema web desarrollado para apoyar la gestión de un restaurante oriental. Permite administrar usuarios, platos, pedidos y procesos de cocina de manera organizada.

Su objetivo es facilitar el trabajo del personal, mejorar el control de los pedidos y optimizar la atención a los clientes.

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
- Gestiona usuarios.
- Gestiona platos.
- Supervisa pedidos.

### Cocina
- Visualiza pedidos.
- Actualiza estados de preparación.

### Usuario
- Accede al sistema según los permisos asignados.

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

### Usuarios

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | Texto |
| correo | Texto |
| rol | Texto |

### Platos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| nombre | Texto |
| precio | Numérico |
| descripcion | Texto |

### Pedidos

| Campo | Tipo |
|---------|---------|
| id | UUID |
| fecha | Fecha |
| estado | Texto |
| total | Numérico |

---

## 10. Instrucciones para ejecutar

1. Clonar el repositorio.
2. Abrir el proyecto en Visual Studio Code.
3. Configurar Supabase.
4. Ejecutar el sistema.
5. Abrir el navegador y acceder al sistema.

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
| Parhuay Meza Idania Chanara | Desarrollo de funcionalidades del sistema |
| Pauccara Huancara Eber | Desarrollo e integración de módulos |
| Santamaria Huaytan Gabriela | Diseño de interfaces y pruebas |
| Sihuincha Palacin Lumeris | Integración general del proyecto, GitHub y documentación |

---

## 13. Problemas encontrados y solución aplicada

### Problema 1
Dificultades en la conexión con Supabase.

**Solución:** Se revisaron las credenciales y la configuración hasta lograr una conexión estable.

### Problema 2
Conflictos al trabajar en equipo con GitHub.

**Solución:** Se utilizaron commits frecuentes y sincronización constante del repositorio.

### Problema 3
Errores en la actualización de pedidos.

**Solución:** Se implementaron validaciones para asegurar el correcto cambio de estados.
