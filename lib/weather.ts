/**
 * Open-Meteo — komplett frei, kein Key.
 * Klima-Historie für Reisezeitraum-Hinweise.
 */
export interface ClimateMonth {
  month: number;
  avgTempC: number;
  precipMm: number;
}

export async function climateNormals(
  lat: number,
  lng: number,
): Promise<ClimateMonth[] | null> {
  const url =
    `https://climate-api.open-meteo.com/v1/climate?` +
    `latitude=${lat}&longitude=${lng}` +
    `&start_date=2010-01-01&end_date=2020-12-31` +
    `&models=EC_Earth3P_HR` +
    `&monthly=temperature_2m_mean,precipitation_sum`;

  try {
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 30 } });
    if (!res.ok) return null;
    const json = await res.json();
    const temps: number[] = json?.monthly?.temperature_2m_mean ?? [];
    const precs: number[] = json?.monthly?.precipitation_sum ?? [];

    // Aggregate to 12 monthly averages
    const byMonth: Record<number, { t: number[]; p: number[] }> = {};
    const times: string[] = json?.monthly?.time ?? [];
    times.forEach((t, i) => {
      const m = new Date(t).getMonth() + 1;
      byMonth[m] ??= { t: [], p: [] };
      if (typeof temps[i] === "number") byMonth[m].t.push(temps[i]);
      if (typeof precs[i] === "number") byMonth[m].p.push(precs[i]);
    });

    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const t = byMonth[m]?.t ?? [];
      const p = byMonth[m]?.p ?? [];
      return {
        month: m,
        avgTempC: t.length ? +(t.reduce((a, b) => a + b, 0) / t.length).toFixed(1) : 0,
        precipMm: p.length ? +(p.reduce((a, b) => a + b, 0) / p.length).toFixed(0) : 0,
      };
    });
  } catch {
    return null;
  }
}
