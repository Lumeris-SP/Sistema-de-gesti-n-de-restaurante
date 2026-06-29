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

## 👥 Tabla de integrantes y responsabilidades

| Foto | Nombre | Responsabilidad |
|------|--------|----------------|
| <img src="https://github.com/user-attachments/assets/aaa1ac7b-968f-4ae6-8205-6e53d156920b" width="120" height="120" style="width:120px;height:120px;object-fit:cover;border-radius:12px;"> | Parhuay Meza Idania Chanara | Desarrollo Frontend / UI |
| <img src="https://github.com/user-attachments/assets/84836290-fd1c-42cb-beed-52d0d746b3e4" width="120" height="120" style="width:120px;height:120px;object-fit:cover;border-radius:12px;"> | Pauccara Huancara Eber | Base de datos / Supabase |
| <img src="https://github.com/user-attachments/assets/ce638641-96d3-4613-89a7-f40e63da9526" width="120" height="120" style="width:120px;height:120px;object-fit:cover;border-radius:12px;"> | Santamaria Huaytan Gabriela | Gestión de pedidos / lógica del sistema |
| <img src="https://github.com/user-attachments/assets/b5a16ac0-13af-46d9-94c1-1313e5844c38" width="120" height="120" style="width:120px;height:120px;object-fit:cover;border-radius:12px;"> | Sihuincha Palacin Lumeris | Coordinación general / documentación / GitHub |

---

## Caso elegido

Sistema de Gestión de Restaurante.

---

## ✨ Descripción del sistema

MAFFIA no es solo un sistema de gestión de restaurante, es el control total de un restaurante oriental en una sola pantalla.

Imagina esto: un pedido entra y en segundos ya está registrado, enviado a cocina y listo para prepararse sin papel, sin confusión y sin errores. Cada plato tiene su estado, cada usuario su rol, y cada acción fluye sin fricción.

Desde el momento en que un cliente ordena hasta que el plato llega a la mesa, todo está conectado en tiempo real. Cocina, administración y atención trabajan sincronizados como un solo sistema.

MAFFIA convierte el caos típico de un restaurante en un flujo ordenado, rápido y preciso, donde cada segundo cuenta y cada error se reduce al mínimo.

No es solo gestión de pedidos, es el control inteligente de toda la operación del restaurante.

---

## Tecnologías usadas

### Frontend
- HTML5
- CSS
- JavaScript

### Base de Datos y Servicios
- Supabase

### Control de Versiones
- Git
- GitHub
- visual Studio

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
## Credenciales de prueba (Supabase Auth)

> Los usuarios están registrados en Supabase Authentication.  
> La contraseña no se muestra por seguridad, se usa la definida al momento del registro.

### Usuarios del sistema

- eber.pauccara@upch.pe  
- gabriela.santamaria@upch.pe  
- gabriela12santamaria@gmail.com  
- idania.parhuay@upch.pe  
- idania.parhuay@gmail.com  
- jesus.morales@upch.pe  
- shedira.sihuincha@upch.pe  
- sihuincha.shedira@upch.pe  
- sihuinchalumeris@gmail.com  

<img width="1577" height="373" alt="image" src="https://github.com/user-attachments/assets/16a49345-513d-4ab4-84c4-5828a150d644" />

### Administrador
- Correo:
- Contraseña:

### Usuario
- Correo:
- Contraseña:
- 
<img width="520" height="866" alt="image" src="https://github.com/user-attachments/assets/b40a49dd-63ac-4ebd-86cf-af2fd7aee58b" />
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
