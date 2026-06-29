<div align="center">

# 🍜🍡 MAFFIA — Restaurante Oriental

<img width="553" height="207" alt="MAFFIA" src="https://github.com/user-attachments/assets/b02df3c2-8b8a-4710-9766-dbda311f228a" />

*Sistema web de gestión integral para restaurante oriental*

</div>

---

## 👨‍👩‍👧‍👦 Integrantes y responsabilidades



<div align="center">

<img width="315" height="315" alt="Integrantes" src="https://github.com/user-attachments/assets/a6a65649-c80b-4745-b5f6-4ba21d8a2fb6" />

</div>

<br>



<div align="center">

| Foto | Nombre | Responsabilidad |
|:----:|:------:|:---------------:|
| <img src="https://github.com/user-attachments/assets/aaa1ac7b-968f-4ae6-8205-6e53d156920b" width="100" style="border-radius:50%"> | **Parhuay Meza Idania Chanara** | 🎨 Desarrollo Frontend / Diseño de Interfaces/ Lógica del sistema/ Coordinación general/ Diseño de Interfaces  |
| <img src="https://github.com/user-attachments/assets/84836290-fd1c-42cb-beed-52d0d746b3e4" width="100" style="border-radius:50%"> | **Pauccara Huancara Eber** | 🗄️ Desarrollo Frontend / Coordinación general/ Ideas para el sistema web/Diseño de Interfaces |
| <img src="https://github.com/user-attachments/assets/ce638641-96d3-4613-89a7-f40e63da9526" width="100" style="border-radius:50%"> | **Santamaria Huaytan Gabriela** | 📋 Desarrollo Frontend /Gestión de platos/ Diseño de Interfaces/Ideas para el sistema web |
| <img src="https://github.com/user-attachments/assets/b5a16ac0-13af-46d9-94c1-1313e5844c38" width="100" style="border-radius:50%"> | **Sihuincha Palacin Lumeris** | 🗂️ Base de datos /Diseño de Interfaces/ Coordinación general / Documentación / GitHub |

</div>

---

## 📌 Caso elegido

> **Sistema de Gestión de Restaurante Oriental**

---

## ✨ Descripción del sistema 💕

**MAFFIA** es un sistema web desarrollado para optimizar la administración de un restaurante oriental, permitiendo gestionar pedidos, platos, cocina, usuarios y facturación desde una sola plataforma.

El sistema permite que los pedidos realizados sean registrados automáticamente, enviados al área de cocina y monitoreados en tiempo real mediante diferentes estados de preparación. Asimismo, incorpora un sistema de autenticación con diferentes roles de usuario, garantizando que cada integrante del restaurante acceda únicamente a las funciones correspondientes.

Gracias a la integración con **Supabase**, toda la información permanece sincronizada en tiempo real, facilitando una administración rápida, segura y eficiente.

---

## 🛠️ Tecnologías usadas

<div align="center">

| Categoría | Tecnologías |
|:---------:|:-----------:|
| **Frontend** | HTML5 · CSS · JavaScript |
| **Base de datos** | Supabase · SQL |
| **Control de versiones** | Git · GitHub |
| **Editor de código** | Visual Studio Code |

</div>

---

## 📦 Módulos desarrollados

<div align="center">

| # | Módulo |
|:-:|:------:|
| 1 | Inicio de sesión |
| 2 | Registro de usuarios |
| 3 | Gestión de usuarios |
| 4 | Gestión de platos |
| 5 | Gestión de pedidos |
| 6 | Gestión de cocina |
| 7 | Gestión de facturación |
| 8 | Gestión de perfil de usuario |

</div>

---

## 🔐 Roles implementados

<div align="center">

| Rol | Descripción |
|:---:|:-----------:|
| 👑 Administrador | Acceso total al sistema |
| 👨‍🍳 Personal de Cocina | Gestión del área de cocina |
| 👤 Usuario | Acceso básico al sistema |
| 👩‍💼 Mozo | Gestion del area de pedidos y de cuenta|

</div>

---

## 🔑 Credenciales de prueba

### Usuarios registrados

<div align="center">

<img width="1577" height="373" src="https://github.com/user-attachments/assets/16a49345-513d-4ab4-84c4-5828a150d644">

</div>

<details>
<summary>Ver lista de correos registrados</summary>

- eber.pauccara@upch.pe
- gabriela.santamaria@upch.pe
- gabriela12santamaria@gmail.com
- idania.parhuay@upch.pe
- idania.parhuay@gmail.com
- jesus.morales@upch.pe
- shedira.sihuincha@upch.pe
- sihuincha.shedira@upch.pe
- sihuinchalumeris@gmail.com

</details>

<br>

<div align="center">

| Rol | Correo | Contraseña |
|:---:|:------:|:----------:|
| **Administrador** | `admin@maffia.com` | `********` |
| **Usuario** | `usuario@maffia.com` | `********` |

</div>

<div align="center">

<img width="520" height="866" src="https://github.com/user-attachments/assets/b40a49dd-63ac-4ebd-86cf-af2fd7aee58b">

</div>

---

## 🗃️ Estructura de tablas

<details>
<summary><b>📄 Adicionales</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| id | UUID |
| nombre | TEXT |
| precio | NUMERIC |

</div>
</details>

<details>
<summary><b>🚫 Alérgenos</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| id | INT |
| nombre | TEXT |

</div>
</details>

<details>
<summary><b>🔗 Factura_Pedidos</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| factura_id | UUID |
| pedido_id | UUID |

</div>
</details>

<details>
<summary><b>🧾 Facturas</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
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

</div>
</details>

<details>
<summary><b>➕ Pedido_Item_Adicionales</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| id | UUID |
| pedido_item_id | UUID |
| texto | TEXT |
| extra | NUMERIC |

</div>
</details>

<details>
<summary><b>🍽️ Pedido_Items</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| id | UUID |
| pedido_id | UUID |
| plato_id | UUID |
| nombre_snapshot | TEXT |
| precio_unitario | NUMERIC |
| cantidad | INT |
| subtotal | NUMERIC |
| estado_plato | TEXT |
| tiempo_estimado_min | INT |

</div>
</details>

<details>
<summary><b>📋 Pedidos</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
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

</div>
</details>

<details>
<summary><b>⚠️ Plato_Alérgenos</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| plato_id | UUID |
| alergeno | INT |
| detalle_otro | TEXT |

</div>
</details>

<details>
<summary><b>🥘 Platos</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
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

</div>
</details>

<details>
<summary><b>👤 Usuarios</b></summary>

<div align="center">

| Campo | Tipo |
|:-----:|:----:|
| id | UUID |
| nombre | TEXT |
| apellidos | TEXT |
| correo | TEXT |
| celular | TEXT |
| auth_user_id | UUID |
| rol | TEXT |
| estado | TEXT |
| fecha_registro | TIMESTAMP |

</div>
</details>

---

## 📝 Instrucciones para ejecutar

### 1. Clonar el repositorio

```bash
git clone https://github.com/USUARIO/MAFFIA.git
```

### 2. Ingresar al proyecto

```bash
cd MAFFIA
```

### 3. Abrir el proyecto

Abrir la carpeta con **Visual Studio Code**.

### 4. Configurar Supabase

Crear un archivo `.env` con las siguientes variables:

```env
SUPABASE_URL=TU_SUPABASE_URL
SUPABASE_ANON_KEY=TU_SUPABASE_ANON_KEY
```

### 5. Restaurar la base de datos

1. Abrir **Supabase**
2. Ingresar al **SQL Editor**
3. Ejecutar el archivo `database.sql` incluido en el repositorio
4. Esperar a que todas las tablas sean creadas correctamente

### 6. Ejecutar el proyecto

> **Opción 1 — Recomendada**

Instalar la extensión **Live Server** de Visual Studio Code, abrir `index.html` y seleccionar **Open with Live Server**.

> **Opción 2**

Abrir directamente el archivo `index.html` desde cualquier navegador web.

---

## 📸 Capturas del sistema

<details>
<summary><b>🔐 Inicio de sesión</b></summary>
<div align="center">
<img width="617" height="782" alt="Inicio de sesión" src="https://github.com/user-attachments/assets/6b77cefd-fccf-4299-94fe-8c6f8cfb06fc" />
</div>
</details>

<details>
<summary><b>📝 Registro de cuenta</b></summary>
<div align="center">
<img width="566" height="873" alt="Registro de cuenta" src="https://github.com/user-attachments/assets/27fbd04d-0d03-4d9a-87a1-ac49e53203b0" />
</div>
</details>

<details>
<summary><b>🏠 Panel principal</b></summary>
<div align="center">
<img width="1863" height="776" alt="Panel principal" src="https://github.com/user-attachments/assets/36c34972-5043-4b99-adba-1e7907894964" />
</div>
</details>

<details>
<summary><b>👥 Gestión de usuarios</b></summary>
<div align="center">
<img width="1847" height="842" alt="Gestión de usuarios" src="https://github.com/user-attachments/assets/ac6024b7-de70-492b-92fd-24dec3151eac" />
</div>
</details>

<details>
<summary><b>🍽️ Gestión de platos</b></summary>
<div align="center">
<img width="1847" height="837" alt="Gestión de platos" src="https://github.com/user-attachments/assets/8c656104-0731-4358-b679-0908f9ffc903" />
</div>
</details>

<details>
<summary><b>📋 Gestión de pedidos</b></summary>
<div align="center">
<img width="1860" height="761" alt="Gestión de pedidos" src="https://github.com/user-attachments/assets/7708f260-8ecf-4daa-928c-4fe0c440d077" />
</div>
</details>

<details>
<summary><b>👨‍🍳 Gestión de cocina</b></summary>
<div align="center">
<img width="1852" height="815" alt="Gestión de cocina" src="https://github.com/user-attachments/assets/31e1c6f4-2d0d-4b3d-a24e-85d0d3da7863" />
</div>
</details>

<details>
<summary><b>🧾 Facturación</b></summary>
<div align="center">
<img width="1860" height="733" alt="Facturación" src="https://github.com/user-attachments/assets/2ae00bd4-67ca-4471-be95-06736f1e8818" />
<br><br>
<img width="492" height="813" alt="Detalle de factura" src="https://github.com/user-attachments/assets/33b99725-b925-4980-9c65-aeedaf55853b" />
</div>
</details>

---

## ⚠️ Problemas encontrados y soluciones

<div align="center">

| Problema encontrado | Solución aplicada |
|:-------------------:|:-----------------:|
| Conflictos en GitHub entre integrantes | Ramas independientes + Git Merge con resolución manual |
| Errores en relación entre tablas | Rediseño del modelo relacional con claves primarias y foráneas |
| Problemas de conexión con Supabase | Verificación de credenciales y corrección de URL y clave pública |
| Validación incorrecta de formularios | Validaciones en JavaScript antes de enviar a la base de datos |
| Actualización de estados en cocina | Lógica de actualización dinámica para reflejar progreso en tiempo real |

</div>

---

## 📝 Conclusión

El desarrollo de **MAFFIA** representó una experiencia integral que nos permitió llevar a la práctica conocimientos fundamentales en desarrollo web, diseño de bases de datos relacionales, autenticación de usuarios, control de versiones y trabajo en equipo.

El resultado es una plataforma moderna, segura y eficiente que centraliza toda la operación de un restaurante oriental en un solo sistema: desde la toma de pedidos hasta la facturación final, pasando por la gestión en cocina y la administración de usuarios.

Este proyecto nos demostró que la organización, la comunicación y la colaboración son tan importantes como el código mismo.

> *"Un buen sistema no solo resuelve problemas — los previene."*

---

<div align="center">

*Desarrollado con ❤️ por el equipo MAFFIA — UPCH🥰*

</div>
