# MAFFIA - Restaurante Oriental

<p align="center">
  <img width="553" height="207" alt="MAFFIA" src="https://github.com/user-attachments/assets/b02df3c2-8b8a-4710-9766-dbda311f228a" />
</p>

---

# Integrantes

<p align="center">
  <img width="315" height="315" alt="Integrantes" src="https://github.com/user-attachments/assets/a6a65649-c80b-4745-b5f6-4ba21d8a2fb6" />
</p>

---

# 👥 Tabla de integrantes y responsabilidades

| Foto | Nombre | Responsabilidad |
|------|--------|----------------|
| <img src="https://github.com/user-attachments/assets/aaa1ac7b-968f-4ae6-8205-6e53d156920b" width="120"> | **Parhuay Meza Idania Chanara** | Desarrollo Frontend / Diseño de Interfaces |
| <img src="https://github.com/user-attachments/assets/84836290-fd1c-42cb-beed-52d0d746b3e4" width="120"> | **Pauccara Huancara Eber** | Base de datos / Supabase |
| <img src="https://github.com/user-attachments/assets/ce638641-96d3-4613-89a7-f40e63da9526" width="120"> | **Santamaria Huaytan Gabriela** | Gestión de pedidos / Lógica del sistema |
| <img src="https://github.com/user-attachments/assets/b5a16ac0-13af-46d9-94c1-1313e5844c38" width="120"> | **Sihuincha Palacin Lumeris** | Coordinación general / Documentación / GitHub |

---

# Caso elegido

**Sistema de Gestión de Restaurante Oriental.**

---

# ✨ Descripción del sistema

MAFFIA es un sistema web desarrollado para optimizar la administración de un restaurante oriental, permitiendo gestionar pedidos, platos, cocina, usuarios y facturación desde una sola plataforma.

El sistema permite que los pedidos realizados sean registrados automáticamente, enviados al área de cocina y monitoreados en tiempo real mediante diferentes estados de preparación. Asimismo, incorpora un sistema de autenticación con diferentes roles de usuario, garantizando que cada integrante del restaurante acceda únicamente a las funciones correspondientes.

Gracias a la integración con Supabase, toda la información permanece sincronizada en tiempo real, facilitando una administración rápida, segura y eficiente.

---

# Tecnologías usadas

## Frontend

- HTML5
- CSS3
- JavaScript

## Base de Datos

- Supabase
- PostgreSQL

## Control de Versiones

- Git
- GitHub

## Editor de Código

- Visual Studio Code

---

# Módulos desarrollados

- Inicio de sesión
- Registro de usuarios
- Gestión de usuarios
- Gestión de platos
- Gestión de pedidos
- Gestión de cocina
- Gestión de facturación
- Gestión de perfil de usuario

---

# Roles implementados

- Administrador
- Personal de Cocina
- Usuario

---

# Credenciales de prueba

## Usuarios registrados

- eber.pauccara@upch.pe
- gabriela.santamaria@upch.pe
- gabriela12santamaria@gmail.com
- idania.parhuay@upch.pe
- idania.parhuay@gmail.com
- jesus.morales@upch.pe
- shedira.sihuincha@upch.pe
- sihuincha.shedira@upch.pe
- sihuinchalumeris@gmail.com

<img width="1577" height="373" src="https://github.com/user-attachments/assets/16a49345-513d-4ab4-84c4-5828a150d644">

---

## Administrador

Correo:

```
admin@maffia.com
```

Contraseña

```
********
```

---

## Usuario

Correo

```
usuario@maffia.com
```

Contraseña

```
********
```

---

<img width="520" height="866" src="https://github.com/user-attachments/assets/b40a49dd-63ac-4ebd-86cf-af2fd7aee58b">

---

# Estructura de tablas

## Adicionales

| Campo | Tipo |
|------|------|
| id | UUID |
| nombre | TEXT |
| precio | NUMERIC |

---

## Alérgenos

| Campo | Tipo |
|------|------|
| id | INT |
| nombre | TEXT |

---

## Factura_Pedidos

| Campo | Tipo |
|------|------|
| factura_id | UUID |
| pedido_id | UUID |

---

## Facturas

| Campo | Tipo |
|------|------|
| id | UUID |
| codigo | TEXT |
| mesa | INT |
| subtotal | NUMERIC |
| descuento | NUMERIC |
| justificacion_descuento | TEXT |
| con_igv | BOOLEAN |
| igv | NUMERIC |
| total | NUMERIC |
| metodo_pago | TEXT |
| monto_recibido | NUMERIC |
| vuelto | NUMERIC |
| estado | TEXT |
| motivo_anulacion | TEXT |
| created_at | TIMESTAMP |

---

## Pedido_Item_Adicionales

| Campo | Tipo |
|------|------|
| id | UUID |
| pedido_item_id | UUID |
| texto | TEXT |
| extra | NUMERIC |

---

## Pedido_Items

| Campo | Tipo |
|------|------|
| id | UUID |
| pedido_id | UUID |
| plato_id | UUID |
| nombre_snapshot | TEXT |
| precio_unitario | NUMERIC |
| cantidad | INT |
| subtotal | NUMERIC |
| estado_plato | TEXT |
| tiempo_estimado_min | INT |

---

## Pedidos

| Campo | Tipo |
|------|------|
| id | UUID |
| codigo | TEXT |
| mesa | INT |
| cliente | TEXT |
| mesero | TEXT |
| estado | TEXT |
| estado_cocina | TEXT |
| prioridad | TEXT |
| justificacion_urgente | TEXT |
| observacion_general | TEXT |
| total | NUMERIC |
| created_at | TIMESTAMP |

---

## Plato_Alérgenos

| Campo | Tipo |
|------|------|
| plato_id | UUID |
| alergeno | INT |
| detalle_otro | TEXT |

---

## Platos

| Campo | Tipo |
|------|------|
| id | UUID |
| codigo | TEXT |
| nombre | TEXT |
| descripcion | TEXT |
| categoria | TEXT |
| precio | NUMERIC |
| tiempo_minutos | INT |
| estado | TEXT |
| modificable | TEXT |
| alergias | TEXT |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |

---

## Usuarios

| Campo | Tipo |
|------|------|
| id | UUID |
| nombre | TEXT |
| apellidos | TEXT |
| correo | TEXT |
| celular | TEXT |
| auth_user_id | UUID |
| rol | TEXT |
| estado | TEXT |
| fecha_registro | TIMESTAMP |

---

# Instrucciones para ejecutar

## 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/MAFFIA.git
```

---

## 2. Ingresar al proyecto

```bash
cd MAFFIA
```

---

## 3. Abrir el proyecto

Abrir la carpeta del proyecto utilizando **Visual Studio Code**.

---

## 4. Configurar Supabase

Crear un archivo `.env` o configurar las credenciales dentro del proyecto.

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

---

## 5. Restaurar la base de datos

1. Abrir Supabase.
2. Ingresar al SQL Editor.
3. Ejecutar el archivo **database.sql** incluido en el repositorio.
4. Esperar a que todas las tablas sean creadas correctamente.

---

## 6. Ejecutar el proyecto

Al ser un proyecto desarrollado con HTML, CSS y JavaScript, existen dos formas de ejecutarlo.

### Opción 1 (Recomendada)

Instalar la extensión **Live Server** de Visual Studio Code.

Abrir:

```
index.html
```

Luego seleccionar:

```
Open with Live Server
```

### Opción 2

Abrir directamente el archivo **index.html** desde cualquier navegador web.

---

# Capturas del sistema

## Inicio de sesión

<p align="center">
<img src="URL_LOGIN" width="900">
</p>

---

## Panel principal

<p align="center">
<img src="URL_DASHBOARD" width="900">
</p>

---

## Gestión de usuarios

<p align="center">
<img src="URL_USUARIOS" width="900">
</p>

---

## Gestión de platos

<p align="center">
<img src="URL_PLATOS" width="900">
</p>

---

## Gestión de pedidos

<p align="center">
<img src="URL_PEDIDOS" width="900">
</p>

---

## Gestión de cocina

<p align="center">
<img src="URL_COCINA" width="900">
</p>

---

## Facturación

<p align="center">
<img src="URL_FACTURAS" width="900">
</p>

---

# División de responsabilidades

| Integrante | Responsabilidades |
|------------|-------------------|
| **Parhuay Meza Idania Chanara** | Diseño de interfaces, desarrollo Frontend, validaciones de formularios y experiencia de usuario. |
| **Pauccara Huancara Eber** | Diseño de la base de datos, implementación de Supabase, autenticación y consultas SQL. |
| **Santamaria Huaytan Gabriela** | Desarrollo de la lógica del sistema, gestión de pedidos, cocina y facturación. |
| **Sihuincha Palacin Lumeris** | Coordinación del proyecto, integración de módulos, documentación, GitHub y elaboración del README. |

---

# Problemas encontrados y solución aplicada

| Problema encontrado | Solución aplicada |
|--------------------|-------------------|
| Conflictos entre cambios realizados por distintos integrantes en GitHub. | Se trabajó mediante ramas independientes y posteriormente se integraron utilizando Git Merge, resolviendo los conflictos manualmente. |
| Errores en la relación entre tablas de la base de datos. | Se rediseñó el modelo relacional utilizando claves primarias y claves foráneas para asegurar la integridad de los datos. |
| Problemas de conexión entre la aplicación y Supabase. | Se verificaron las credenciales del proyecto y se corrigió la configuración de la conexión mediante la URL y la clave pública. |
| Validación incorrecta de algunos formularios. | Se implementaron validaciones en JavaScript antes de enviar la información a la base de datos. |
| Actualización de estados de los pedidos en cocina. | Se implementó una lógica de actualización dinámica para reflejar el progreso de cada pedido en tiempo real. |

---

# Conclusión

El desarrollo de MAFFIA permitió aplicar conocimientos sobre desarrollo web, bases de datos relacionales, autenticación de usuarios, control de versiones y trabajo colaborativo. El sistema obtenido facilita la administración de un restaurante mediante una plataforma moderna, organizada y eficiente, optimizando el proceso de atención, preparación de pedidos y facturación.
