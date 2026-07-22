import type { Place, PlaceKind } from "./types";

/**
 * Wenn eine Reise aus einem AI-Vorschlag erstellt wird, seeden wir 4–6
 * sinnvolle Start-Pins. So ist der Trip-Detail-View nie leer.
 */
type Seed = Omit<Place, "id" | "tripId" | "sortOrder">;

const SEEDS: Record<string, Seed[]> = {
  Hvar: [
    { kind: "hotel", name: "Altstadt-Apartment", lat: 43.1729, lng: 16.4413, description: "Stari Grad, Altstadt" },
    { kind: "sight", name: "Spanjola-Festung", lat: 43.1761, lng: 16.4421, description: "Sonnenuntergangs-Hike, 20 Min" },
    { kind: "nature", name: "Pakleni-Inseln", lat: 43.1576, lng: 16.3895, description: "Bootstour, türkises Wasser" },
    { kind: "food", name: "Konoba Menego", lat: 43.1727, lng: 16.4417, description: "Traditionell, dalmatinisch" },
  ],
  Annecy: [
    { kind: "hotel", name: "Vieille Ville Unterkunft", lat: 45.8992, lng: 6.1294 },
    { kind: "sight", name: "Palais de l'Isle", lat: 45.8987, lng: 6.1280, description: "Insel-Schloss in den Kanälen" },
    { kind: "nature", name: "Plage d'Albigny", lat: 45.9095, lng: 6.1480, description: "Stadtstrand am See" },
    { kind: "nature", name: "Col de la Forclaz", lat: 45.8123, lng: 6.2342, description: "Aussicht, Gleitschirme" },
  ],
  Matera: [
    { kind: "hotel", name: "Sasso Caveo Stay", lat: 40.6664, lng: 16.6043, description: "Höhlenhotel im Sasso Caveoso" },
    { kind: "sight", name: "Sassi di Matera", lat: 40.6665, lng: 16.6107, description: "UNESCO-Altstadt" },
    { kind: "sight", name: "Cripta del Peccato Originale", lat: 40.6210, lng: 16.5340, description: "Höhlenkirche mit Fresken" },
    { kind: "food", name: "Soul Kitchen", lat: 40.6660, lng: 16.6090, description: "Modern lukanisch" },
  ],
  Lofoten: [
    { kind: "hotel", name: "Reine Rorbuer", lat: 67.9311, lng: 13.0876, description: "Klassische Fischerhütten" },
    { kind: "nature", name: "Reinebringen", lat: 67.9355, lng: 13.0992, description: "Treppen-Hike, 60–90 Min" },
    { kind: "nature", name: "Kvalvika Beach", lat: 68.1361, lng: 13.2920, description: "Versteckte Bucht-Wanderung" },
    { kind: "sight", name: "Henningsvær", lat: 68.1542, lng: 14.2009, description: "Fischerdorf, Galerien" },
  ],
  Gent: [
    { kind: "hotel", name: "Patershol Stay", lat: 51.0589, lng: 3.7234 },
    { kind: "sight", name: "Gravensteen", lat: 51.0573, lng: 3.7204, description: "Mittelalterliche Burg" },
    { kind: "food", name: "Le Botaniste", lat: 51.0530, lng: 3.7220, description: "Vegetarisch, lokal" },
    { kind: "sight", name: "Sint-Baafskathedraal", lat: 51.0533, lng: 3.7264, description: "Genter Altar" },
  ],
  Madeira: [
    { kind: "hotel", name: "Funchal Altstadt", lat: 32.6499, lng: -16.9081 },
    { kind: "nature", name: "Levada do Caldeirão Verde", lat: 32.7833, lng: -16.9000, description: "Klassische Levada-Wanderung" },
    { kind: "nature", name: "Pico do Arieiro", lat: 32.7355, lng: -16.9281, description: "Bergspitze, oft über den Wolken" },
    { kind: "sight", name: "Câmara de Lobos", lat: 32.6486, lng: -16.9772, description: "Fischerdorf mit Aussicht" },
  ],
  "Český Krumlov": [
    { kind: "hotel", name: "Altstadt-Pension", lat: 48.8127, lng: 14.3175 },
    { kind: "sight", name: "Schloss Český Krumlov", lat: 48.8128, lng: 14.3147 },
    { kind: "sight", name: "Egon-Schiele-Kunstzentrum", lat: 48.8104, lng: 14.3155 },
    { kind: "food", name: "Krčma v Šatlavské", lat: 48.8113, lng: 14.3168, description: "Mittelalterliche Taverne" },
  ],
  Sintra: [
    { kind: "hotel", name: "Vila Sintra", lat: 38.7980, lng: -9.3902 },
    { kind: "sight", name: "Palácio da Pena", lat: 38.7878, lng: -9.3905, description: "Früh hin, vor den Bussen" },
    { kind: "sight", name: "Quinta da Regaleira", lat: 38.7969, lng: -9.3962, description: "Initiations-Brunnen" },
    { kind: "nature", name: "Cabo da Roca", lat: 38.7800, lng: -9.4989, description: "Westlichster Punkt Europas" },
  ],
  "Tiroler Zillertal": [
    { kind: "hotel", name: "Mayrhofen Pension", lat: 47.1656, lng: 11.8590 },
    { kind: "nature", name: "Berliner Höhenweg", lat: 47.0670, lng: 11.7837, description: "Klassische Mehrtages-Tour" },
    { kind: "sight", name: "Hintertuxer Gletscher", lat: 47.0775, lng: 11.6722 },
    { kind: "food", name: "Hütte Wiesenalm", lat: 47.1542, lng: 11.8728, description: "Bergrestaurant" },
  ],
  Comporta: [
    { kind: "hotel", name: "Sublime Comporta", lat: 38.3500, lng: -8.7833 },
    { kind: "nature", name: "Praia da Comporta", lat: 38.3825, lng: -8.7945, description: "Endloser Sandstrand" },
    { kind: "food", name: "Sal Restaurante", lat: 38.3838, lng: -8.7920, description: "Strandlokal" },
    { kind: "sight", name: "Reisfelder von Comporta", lat: 38.4000, lng: -8.7700 },
  ],
};

export function seedsFor(destinationName: string): Seed[] {
  return SEEDS[destinationName] ?? [];
}
