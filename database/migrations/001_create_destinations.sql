-- =====================================================================
-- Migration 001 - Tabelle destinations
-- Reiseziel-Datenbank fuer Supabase / PostgreSQL.
-- Passend zu database/seed/destinations.json (300 Orte, 31 Felder pro Ort).
-- Bewertungslogik: siehe database/scoring_rules.md
-- Seed danach: node database/seed/seed_destinations.js
--
-- Ausfuehren im Supabase SQL-Editor oder via psql.
-- =====================================================================

-- Optionales Enum fuer das Budget-Level (menschenlesbares Label)
do $$
begin
  if not exists (select 1 from pg_type where typname = 'budget_level') then
    create type budget_level as enum ('niedrig', 'mittel', 'gehoben', 'hoch');
  end if;
end$$;

create table if not exists destinations (
  -- Identitaet
  id                        text primary key,          -- slug, z. B. "madeira_pt"
  name                      text not null,
  country                   text not null,
  region                    text,
  continent                 text not null
    check (continent in ('Europa','Asien','Nordamerika','Suedamerika','Afrika','Ozeanien','Sonderregion')),

  -- Klassifizierung & Texte (Deutsch)
  categories                text[]  not null default '{}',
  description               text,
  highlights                text[]  not null default '{}',

  -- Erlebnis-Scores (0-100)
  nature_score              smallint not null check (nature_score          between 0 and 100),
  photography_score         smallint not null check (photography_score     between 0 and 100),
  adventure_score           smallint not null check (adventure_score       between 0 and 100),
  hiking_score              smallint not null check (hiking_score          between 0 and 100),
  city_score                smallint not null check (city_score            between 0 and 100),
  culture_score             smallint not null check (culture_score         between 0 and 100),
  beach_score               smallint not null check (beach_score           between 0 and 100),
  wildlife_score            smallint not null check (wildlife_score        between 0 and 100),
  nightlife_score           smallint not null check (nightlife_score       between 0 and 100),
  luxury_score              smallint not null check (luxury_score          between 0 and 100),

  -- Richtungs-Scores (0-100). budget_score: hoch = guenstig. tourist_density_score: hoch = ueberlaufen.
  budget_score              smallint not null check (budget_score          between 0 and 100),
  tourist_density_score     smallint not null check (tourist_density_score between 0 and 100),

  -- Leit-Score (0-100): haut mich um
  wow_factor_score          smallint not null check (wow_factor_score      between 0 and 100),

  -- Reiseinformationen
  best_months               smallint[] not null default '{}',   -- Monatszahlen 1-12
  minimum_days              smallint not null check (minimum_days > 0),
  ideal_days                smallint not null check (ideal_days >= minimum_days),
  estimated_budget_level    budget_level not null,
  flight_access_score       smallint not null check (flight_access_score   between 0 and 100),  -- hoch = leicht erreichbar
  car_needed                boolean  not null,
  solo_friendly             boolean  not null,
  safety_score              smallint not null check (safety_score          between 0 and 100),  -- hoch = sicher
  trip_effort_score         smallint not null check (trip_effort_score     between 0 and 100),  -- hoch = aufwendig
  season_flexibility_score  smallint not null check (season_flexibility_score between 0 and 100), -- hoch = ganzjaehrig

  -- Konsistenz: budget_score muss zum Label passen (siehe scoring_rules.md, Abschnitt 6)
  constraint budget_label_consistency check (
    (estimated_budget_level = 'niedrig' and budget_score between 75 and 100) or
    (estimated_budget_level = 'mittel'  and budget_score between 55 and 74)  or
    (estimated_budget_level = 'gehoben' and budget_score between 35 and 54)  or
    (estimated_budget_level = 'hoch'    and budget_score between 0  and 34)
  ),

  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- Indizes fuer die typische Vorauswahl-Logik ------------------------------
create index if not exists idx_dest_wow            on destinations (wow_factor_score desc);
create index if not exists idx_dest_continent      on destinations (continent);
create index if not exists idx_dest_budget         on destinations (budget_score desc);
create index if not exists idx_dest_safety         on destinations (safety_score desc);
create index if not exists idx_dest_min_days       on destinations (minimum_days);
create index if not exists idx_dest_effort         on destinations (trip_effort_score);
-- GIN-Indizes fuer Array-Filter (Kategorie enthaelt X, Reisemonat enthaelt X)
create index if not exists idx_dest_categories     on destinations using gin (categories);
create index if not exists idx_dest_best_months    on destinations using gin (best_months);

-- updated_at automatisch pflegen ------------------------------------------
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_dest_updated_at on destinations;
create trigger trg_dest_updated_at
  before update on destinations
  for each row execute function set_updated_at();

-- Row Level Security ------------------------------------------------------
-- Die Datenbank ist eine oeffentliche Wissensbasis: Lesen fuer alle erlaubt,
-- Schreiben nur ueber den Service-Role-Key (umgeht RLS) beim Import.
alter table destinations enable row level security;

drop policy if exists "destinations_public_read" on destinations;
create policy "destinations_public_read"
  on destinations for select
  using (true);
