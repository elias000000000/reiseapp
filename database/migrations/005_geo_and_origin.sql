-- =====================================================================
-- Migration 005 - Koordinaten fuer destinations + Startort in trip_requests
-- Grundlage fuer den Distanz-/Machbarkeits-Filter (destinationFilter.service.ts)
-- und spaeter, geschenkt, die Kartenansicht auf der Detailseite (Phase 2).
--
-- destinations.latitude/longitude: nullable, per einmaligem Geocoding-Script
-- befuellt (database/seed/fetch_coordinates.js). Kein Treffer -> Distanzfilter
-- greift fuer diesen Ort einfach nicht (kein Ausschluss ohne Datengrundlage).
-- =====================================================================

alter table destinations
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;

-- NOT NULL ist sicher: Migration 004 leert trip_requests vorher, die Tabelle
-- ist zu diesem Zeitpunkt also leer (nur gueltig, wenn 004 vor 005 laeuft).
alter table trip_requests
  add column if not exists origin_lat double precision not null,
  add column if not exists origin_lng double precision not null,
  add column if not exists origin_label text not null;
