-- =====================================================================
-- Migration 003 - Bild-Felder fuer destinations
-- image_url: Hotlink auf automatisiert bezogenes Bild (Pexels-CDN).
-- image_attribution: Lizenz-/Fotografen-Nachweis fuer die Anzeige.
-- Beide nullable: Orte ohne Treffer bleiben NULL, das Frontend nutzt
-- dann einen kuratierten Kategorie-Fallback (siehe design-system.md §7).
-- Bilder befuellen: node database/seed/fetch_images.js
-- =====================================================================

alter table destinations
  add column if not exists image_url text,
  add column if not exists image_attribution text;
