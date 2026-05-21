import { fileNames, SECTOR_PURCHASES_FILE_SLUG } from "../util/util";
import { SECTOR_DASHBOARD_INDICATORS } from "./curatedIndicators";

/** Max indicators on one dashboard page (chart load cost). */
export const SECTOR_DASHBOARD_MAX_INDICATORS = 6;

/** Full smart-sector list minus sector-purchases (not multi-dashboard ready). */
export const SECTOR_DASHBOARD_PICKABLE: readonly string[] = fileNames.filter(
  (s) => s !== SECTOR_PURCHASES_FILE_SLUG,
);

/** JSON file slug → USEEIO-style code for URLs (`?ind=`). */
const SLUG_TO_CODE: Record<string, string> = {
  "Acidification-Potential": "ACID",
  "Eutrophication-Potential": "EUTR",
  "GWP-AR6-100": "GCC",
  "Human-Health---Respiratory-Effects": "HRSP",
  "Smog-Formation-Potential": "SMOG",
  "Freshwater-withdrawals": "WATR",
  "Ozone-Depletion": "OZON",
  "Jobs-Supported": "JOBS",
  "Commercial-RCRA-Hazardous-Waste": "CRHW",
  "Criteria-Air-Pollutants": "CAP",
  "Releases-to-Ground": "RTG",
  "Carbon-dioxide": "CO2",
  "Carbon-monoxide": "COM",
  "Lead": "LEAD",
  "Methane": "CH4",
  "Nitrogen-dioxide": "NO2",
  "Nitrous-oxide": "N2O",
  "Particulate-matter-2.5": "PM25",
  "Sulfur-dioxide": "SO2",
};

const CODE_TO_SLUG: Record<string, string> = {};
for (const slug of SECTOR_DASHBOARD_PICKABLE) {
  const code = SLUG_TO_CODE[slug] ?? slugToFallbackCode(slug);
  CODE_TO_SLUG[code.toUpperCase()] = slug;
}

function slugToFallbackCode(slug: string): string {
  const base = slug.replace(/[^a-zA-Z0-9]+/g, "").toUpperCase();
  return base.slice(0, 4) || "IND";
}

export function indicatorDomId(slug: string): string {
  return slug.replace(/[^a-zA-Z0-9]+/g, "_");
}

export function slugToIndicatorCode(slug: string): string {
  return SLUG_TO_CODE[slug] ?? slugToFallbackCode(slug);
}

export function indicatorCodeToSlug(token: string): string | undefined {
  const t = token.trim();
  if (!t) {
    return undefined;
  }
  if (t.includes("-")) {
    return SECTOR_DASHBOARD_PICKABLE.includes(t) ? t : undefined;
  }
  return CODE_TO_SLUG[t.toUpperCase()];
}

export function encodeIndicatorsParam(slugs: readonly string[]): string {
  return slugs.map((s) => slugToIndicatorCode(s)).join(",");
}

export function resolveIndicatorsFromParam(
  indParam: string | undefined | null,
): string[] {
  if (!indParam?.trim()) {
    return [...SECTOR_DASHBOARD_INDICATORS];
  }
  const resolved: string[] = [];
  for (const part of indParam.split(",")) {
    const slug = indicatorCodeToSlug(part);
    if (slug && !resolved.includes(slug)) {
      resolved.push(slug);
    }
  }
  if (resolved.length === 0) {
    return [...SECTOR_DASHBOARD_INDICATORS];
  }
  return resolved.slice(0, SECTOR_DASHBOARD_MAX_INDICATORS);
}

export function sameIndicatorSet(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((s, i) => s === b[i]);
}
