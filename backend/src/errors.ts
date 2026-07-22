// Strukturierte Fehler fuer die API. Unterscheidet erwartete, semantisch
// aussagekraeftige Fehler (AppError-Subklassen -> eigener HTTP-Status +
// maschinenlesbarer code) von unerwarteten Fehlern (generischer 500,
// volles Detail landet nur im Server-Log, nicht beim Client).

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class NoCandidatesError extends AppError {
  constructor(
    message = "Keine Reiseziele erfuellen die harten Kriterien (Dauer/Budget/Saison/Komfortzone). Bitte Kriterien lockern."
  ) {
    super(message, "NO_CANDIDATES", 422);
  }
}
