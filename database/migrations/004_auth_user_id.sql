-- =====================================================================
-- Migration 004 - Echte Auth statt spoofbarer user_key
-- Ersetzt trip_requests.user_key (freier, vom Client erfundener Text)
-- durch user_id (uuid, verifiziert gegen auth.users via Supabase Auth).
-- Die Middleware in backend/src/middleware/auth.ts prueft das Bearer-Token
-- serverseitig - die Client-Anfrage kann sich nicht mehr als anderer
-- Nutzer ausgeben.
--
-- WICHTIG: truncate leert trip_requests + recommendations. Das betrifft
-- ausschliesslich die Test-Datensaetze aus unseren eigenen curl-/Browser-
-- Tests dieser Session, keine echten Nutzerdaten.
-- =====================================================================

truncate table recommendations, trip_requests;

alter table trip_requests
  drop column user_key,
  add column user_id uuid not null references auth.users(id) on delete cascade;

drop index if exists idx_trip_requests_user_history;
create index idx_trip_requests_user_history
  on trip_requests (user_id, created_at desc);
