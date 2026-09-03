-- =============================================
-- Juntada Fútbol — Schema SQL para Supabase
-- =============================================

-- Extensión PostGIS para geolocalización
create extension if not exists postgis;

-- =============================================
-- TABLAS
-- =============================================

-- Usuarios (perfil vinculado a auth.users)
create table public.usuarios (
  id uuid references auth.users(id) on delete cascade primary key,
  nombre text not null,
  zona text,
  posicion_preferida text check (posicion_preferida in ('arquero', 'defensor', 'mediocampista', 'delantero')),
  rating numeric(3,2) default 5.00,
  avatar_url text,
  created_at timestamptz default now()
);

-- Partidos
create table public.partidos (
  id uuid default gen_random_uuid() primary key,
  creador_id uuid references public.usuarios(id) on delete cascade not null,
  titulo text not null,
  cancha text,
  ubicacion geography(Point, 4326),
  lat double precision,
  lng double precision,
  fecha_hora timestamptz not null,
  jugadores_necesarios int not null check (jugadores_necesarios > 0),
  jugadores_confirmados int default 0 check (jugadores_confirmados >= 0),
  estado text default 'abierto' check (estado in ('abierto', 'cerrado', 'cancelado')),
  tipo_cancha text default '5' check (tipo_cancha in ('5', '7', '11')),
  notas text,
  created_at timestamptz default now()
);

-- Inscripciones (jugadores anotados a un partido)
create table public.inscripciones (
  id uuid default gen_random_uuid() primary key,
  partido_id uuid references public.partidos(id) on delete cascade not null,
  usuario_id uuid references public.usuarios(id) on delete cascade not null,
  estado text default 'pendiente' check (estado in ('pendiente', 'confirmado', 'rechazado')),
  created_at timestamptz default now(),
  unique(partido_id, usuario_id)
);

-- =============================================
-- ÍNDICES
-- =============================================

create index idx_partidos_estado on public.partidos(estado);
create index idx_partidos_fecha on public.partidos(fecha_hora);
create index idx_partidos_ubicacion on public.partidos using gist(ubicacion);
create index idx_inscripciones_partido on public.inscripciones(partido_id);
create index idx_inscripciones_usuario on public.inscripciones(usuario_id);

-- =============================================
-- FUNCIONES
-- =============================================

-- Buscar partidos abiertos dentro de un radio (km)
create or replace function public.partidos_cercanos(
  user_lat double precision,
  user_lng double precision,
  radio_km double precision default 10
)
returns setof public.partidos
language sql
stable
as $$
  select *
  from public.partidos
  where estado = 'abierto'
    and fecha_hora > now()
    and ubicacion is not null
    and ST_DWithin(
      ubicacion,
      ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography,
      radio_km * 1000
    )
  order by fecha_hora asc;
$$;

-- Trigger: actualizar jugadores_confirmados automáticamente
create or replace function public.actualizar_confirmados()
returns trigger
language plpgsql
security definer
as $$
begin
  update public.partidos
  set jugadores_confirmados = (
    select count(*) from public.inscripciones
    where partido_id = coalesce(NEW.partido_id, OLD.partido_id)
      and estado = 'confirmado'
  )
  where id = coalesce(NEW.partido_id, OLD.partido_id);
  return coalesce(NEW, OLD);
end;
$$;

create trigger on_inscripcion_change
  after insert or update or delete on public.inscripciones
  for each row execute function public.actualizar_confirmados();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

alter table public.usuarios enable row level security;
alter table public.partidos enable row level security;
alter table public.inscripciones enable row level security;

-- Usuarios
create policy "Usuarios: ver todos"
  on public.usuarios for select
  using (auth.role() = 'authenticated');

create policy "Usuarios: crear propio perfil"
  on public.usuarios for insert
  with check (auth.uid() = id);

create policy "Usuarios: actualizar propio perfil"
  on public.usuarios for update
  using (auth.uid() = id);

-- Partidos
create policy "Partidos: ver todos"
  on public.partidos for select
  using (auth.role() = 'authenticated');

create policy "Partidos: crear autenticado"
  on public.partidos for insert
  with check (auth.uid() = creador_id);

create policy "Partidos: actualizar creador"
  on public.partidos for update
  using (auth.uid() = creador_id);

create policy "Partidos: eliminar creador"
  on public.partidos for delete
  using (auth.uid() = creador_id);

-- Inscripciones
create policy "Inscripciones: ver autenticados"
  on public.inscripciones for select
  using (auth.role() = 'authenticated');

create policy "Inscripciones: unirse a partido"
  on public.inscripciones for insert
  with check (auth.uid() = usuario_id);

create policy "Inscripciones: creador confirma/rechaza"
  on public.inscripciones for update
  using (
    exists (
      select 1 from public.partidos
      where partidos.id = inscripciones.partido_id
        and partidos.creador_id = auth.uid()
    )
  );

create policy "Inscripciones: eliminar propia"
  on public.inscripciones for delete
  using (auth.uid() = usuario_id);
