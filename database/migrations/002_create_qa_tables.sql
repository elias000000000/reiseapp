-- =====================================================================
-- Migration 002 - Q&A Persistenz: trip_requests + recommendations
-- Speichert die 11 Antworten des Empfehlungs-Fragenkatalogs sowie die
-- von Claude tatsaechlich vorgeschlagenen Orte (fuer Verlaufs-Tracking,
-- damit Wiederholungsanfragen nicht immer dieselben 5 Orte liefern).
--
-- Setzt Migration 001 voraus (Enum budget_level, Tabelle destinations).
-- Ausfuehren im Supabase SQL-Editor oder via psql.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- trip_requests: eine Anfrage = alle 11 Antworten aus Phase 1 + Phase 2
-- ---------------------------------------------------------------------
create table if not exists trip_requests (
  id                          uuid primary key default gen_random_uuid(),

  -- Client-seitig generierte Kennung (z. B. UUID in localStorage), ersetzt
  -- vorerst ein echtes Auth-System. Identifiziert denselben Nutzer ueber
  -- mehrere Anfragen hinweg fuer das Verlaufs-Tracking.
  user_key                    text not null,

  -- --- Phase 1: harte Filter -------------------------------------------
  duration_days               smallint not null check (duration_days > 0),
  travel_months                smallint[] not null default '{}',   -- leer = flexibel
  budget_level                budget_level not null,               -- Enum aus Migration 001
  party_type                  text not null
    check (party_type in ('solo', 'paar', 'familie', 'freunde')),
  comfort_zone                text not null
    check (comfort_zone in ('sicher', 'ausgewogen', 'abenteuer')),
  car_preference               text not null
    check (car_preference in ('ja', 'wenn_noetig', 'auf_keinen_fall')),

  -- --- Phase 2: Geschmacks-Achsen (bipolar, -100..100, 0 = neutral) -----
  axis_nature_city             smallint not null default 0
    check (axis_nature_city between -100 and 100),
  axis_activity_relax          smallint not null default 0
    check (axis_activity_relax between -100 and 100),
  axis_iconic_hidden            smallint not null default 0
    check (axis_iconic_hidden between -100 and 100),
  axis_luxury_authentic         smallint not null default 0
    check (axis_luxury_authentic between -100 and 100),

  -- Feintuning, ueberspringbar (NULL = uebersprungen, keine Gewichtung)
  axis_photogenic_importance    smallint
    check (axis_photogenic_importance is null or axis_photogenic_importance between 0 and 100),

  -- Steuert den Sampling-Grad in der Scoring-Phase (0 = sicherste Treffer,
  -- 100 = experimentierfreudig). Default 50 = ausgewogen.
  exploration_level             smallint not null default 50
    check (exploration_level between 0 and 100),

  created_at                    timestamptz not null default now()
);

create index if not exists idx_trip_requests_user_history
  on trip_requests (user_key, created_at desc);

-- ---------------------------------------------------------------------
-- recommendations: was Claude fuer eine trip_request tatsaechlich
-- vorgeschlagen hat. Grundlage fuer den Verlaufs-Ausschluss.
-- ---------------------------------------------------------------------
create table if not exists recommendations (
  id                  uuid primary key default gen_random_uuid(),
  trip_request_id     uuid not null references trip_requests(id) on delete cascade,
  destination_id      text not null references destinations(id),
  rank                 smallint not null check (rank > 0),
  reasoning            text not null,
  created_at           timestamptz not null default now()
);

create index if not exists idx_recommendations_trip_request
  on recommendations (trip_request_id);

-- Fuer den Verlaufs-Ausschluss: schnelle Suche "welche destination_ids
-- wurden diesem user_key je schon gezeigt" ueber den Join auf trip_requests.
create index if not exists idx_recommendations_destination
  on recommendations (destination_id);

-- ---------------------------------------------------------------------
-- Row Level Security
-- Im Gegensatz zu destinations enthalten diese Tabellen nutzerbezogene
-- Daten. Kein Public-Read/Write - Zugriff ausschliesslich ueber den
-- Service-Role-Key im Backend (umgeht RLS).
-- ---------------------------------------------------------------------
alter table trip_requests enable row level security;
alter table recommendations enable row level security;
-- Bewusst keine Policies: ohne passende Policy blockt RLS jeden Zugriff
-- ueber den anon/authenticated-Key; der Service-Role-Key umgeht RLS ohnehin.
