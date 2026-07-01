-- MAFFIA - esquema referencial para Supabase
-- Este script documenta las tablas usadas por la aplicacion.

create table if not exists public.usuarios (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid,
  nombre text not null,
  apellidos text,
  correo text not null unique,
  celular text,
  rol text not null check (rol in ('Administrador', 'Mozo', 'Cocina', 'Caja')),
  estado text not null default 'Pendiente',
  fecha_registro timestamptz not null default now()
);

create table if not exists public.platos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nombre text not null,
  descripcion text not null,
  categoria text not null,
  precio numeric(10,2) not null check (precio > 0),
  tiempo_minutos integer not null check (tiempo_minutos > 0),
  estado text not null default 'Activo',
  modificable text,
  creado_en timestamptz not null default now()
);

create table if not exists public.alergenos (
  id bigint primary key generated always as identity,
  nombre text not null unique
);

create table if not exists public.plato_alergenos (
  plato_id uuid references public.platos(id) on delete cascade,
  alergeno_id bigint references public.alergenos(id),
  detalle_otro text,
  primary key (plato_id, alergeno_id)
);

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  mesa integer not null check (mesa between 1 and 50),
  mozo text not null,
  cliente text,
  estado text not null default 'registrado',
  estado_cocina text not null default 'Pendiente',
  prioridad text not null default 'normal',
  justificacion_urgente text,
  observacion_general text,
  total numeric(10,2) not null default 0,
  creado_en timestamptz not null default now()
);

create table if not exists public.pedido_items (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  plato_id uuid references public.platos(id),
  nombre_snapshot text not null,
  precio_unitario numeric(10,2) not null,
  cantidad integer not null check (cantidad > 0),
  subtotal numeric(10,2) not null,
  estado_plato text not null default 'Pendiente',
  tiempo_estimado_min integer
);

create table if not exists public.pedido_item_adicionales (
  id uuid primary key default gen_random_uuid(),
  pedido_item_id uuid not null references public.pedido_items(id) on delete cascade,
  texto text not null,
  extra numeric(10,2) not null default 0
);

create table if not exists public.facturas (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  mesa integer not null,
  subtotal numeric(10,2) not null,
  descuento numeric(10,2) not null default 0,
  justificacion_descuento text,
  con_igv boolean not null default true,
  igv numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  metodo_pago text not null,
  monto_recibido numeric(10,2),
  vuelto numeric(10,2),
  estado text not null default 'Pagada',
  motivo_anulacion text,
  creado_en timestamptz not null default now()
);

create table if not exists public.factura_pedidos (
  factura_id uuid not null references public.facturas(id) on delete cascade,
  pedido_id uuid not null references public.pedidos(id),
  primary key (factura_id, pedido_id)
);

