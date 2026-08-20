/**
 * Canonical indicator order and groupings for smart-sector viewers
 * (Economic → Regulatory → LCIA → Individual pollutants).
 */

export const SECTOR_PURCHASES_FILE_SLUG = "sector-purchases";

/** Chart/legend label for the sector-purchases “Direct” row (same-BEA spend). */
export const SECTOR_PURCHASES_DIRECT_DISPLAY = "Within-sector spend";

export function isDirectContributionLabel(label: string | undefined | null): boolean {
  if (!label) {
    return false;
  }
  return label === "Direct" || label === SECTOR_PURCHASES_DIRECT_DISPLAY;
}

/** Map data “Direct” to the Sector Purchases display name when needed. */
export function displayContributionLabel(
  label: string,
  indicatorSlug: string,
): string {
  if (
    label === "Direct" &&
    indicatorSlug === SECTOR_PURCHASES_FILE_SLUG
  ) {
    return SECTOR_PURCHASES_DIRECT_DISPLAY;
  }
  return label;
}

export type IndicatorGroupId =
  | "economic"
  | "regulatory"
  | "lcia"
  | "individual_pollutants";

export type IndicatorGroup = {
  id: IndicatorGroupId;
  /** Dropdown / picker section label */
  label: string;
  slugs: readonly string[];
};

/** Display names for known indicator file slugs. */
const customLabels: Record<string, string> = {
  "GWP-AR6-100": "Global Warming Potential (CO2e)",
  "Acidification-Potential": "Acidification Potential (SO2 eq)",
  "Eutrophication-Potential": "Eutrophication Potential (N eq)",
  "Freshwater-withdrawals": "Freshwater Withdrawals",
  "Human-Health---Respiratory-Effects":
    "Human Health Respiratory Effects (PM2.5 eq)",
  "Jobs-Supported": "Jobs Supported",
  "Ozone-Depletion": "Ozone Depletion Potential (CFC eq)",
  "Smog-Formation-Potential": "Smog Formation Potential (O3 eq)",
  "Commercial-RCRA-Hazardous-Waste": "Commercial Hazardous Waste",
  "Criteria-Air-Pollutants": "Criteria Air Pollutants",
  "Releases-to-Ground": "Toxic Releases to Land",
  "sector-purchases": "Sector Purchases",
  "Carbon-dioxide": "Carbon Dioxide",
  "Carbon-monoxide": "Carbon Monoxide",
  "Lead": "Lead",
  "Methane": "Methane",
  "Nitrogen-dioxide": "Nitrogen Dioxide",
  "Nitrous-oxide": "Nitrous Oxide",
  "Particulate-matter-2.5": "Particulate Matter 2.5",
  "Sulfur-dioxide": "Sulfur Dioxide",
};

/**
 * Grouped catalog. Order within and across groups is the product order.
 */
export const INDICATOR_GROUPS: readonly IndicatorGroup[] = [
  {
    id: "economic",
    label: "Economic Indicators",
    slugs: ["sector-purchases", "Jobs-Supported"],
  },
  {
    id: "regulatory",
    label: "Regulatory Environmental Indicators",
    slugs: [
      "Commercial-RCRA-Hazardous-Waste",
      "Criteria-Air-Pollutants",
      "Releases-to-Ground",
    ],
  },
  {
    id: "lcia",
    label: "Life Cycle Impact Assessment Metrics",
    slugs: [
      "Acidification-Potential",
      "Eutrophication-Potential",
      "Freshwater-withdrawals",
      "GWP-AR6-100",
      "Human-Health---Respiratory-Effects",
      "Ozone-Depletion",
      "Smog-Formation-Potential",
    ],
  },
  {
    id: "individual_pollutants",
    label: "Individual Pollutants",
    slugs: [
      "Carbon-dioxide",
      "Carbon-monoxide",
      "Lead",
      "Methane",
      "Nitrogen-dioxide",
      "Nitrous-oxide",
      "Particulate-matter-2.5",
      "Sulfur-dioxide",
    ],
  },
] as const;

/** Flat ordered list (same sequence as grouped catalog). */
export const fileNames: string[] = INDICATOR_GROUPS.flatMap((g) => [...g.slugs]);

export function getLabel(filename: string): string {
  if (customLabels[filename]) {
    return customLabels[filename];
  }
  return filename.replace(/-+/g, " ").trim();
}

export function sectorPurchasesPointOfConsumptionOnly(
  indicatorSlug: string,
): boolean {
  return indicatorSlug === SECTOR_PURCHASES_FILE_SLUG;
}

export type IndicatorSelectGroup = {
  id: IndicatorGroupId;
  label: string;
  slugs: string[];
};

/**
 * Groups for selects / pickers. Empty groups after filtering are omitted.
 */
export function getIndicatorSelectGroups(
  options?: { excludeSlugs?: readonly string[] },
): IndicatorSelectGroup[] {
  const exclude = new Set(options?.excludeSlugs ?? []);
  return INDICATOR_GROUPS.map((g) => ({
    id: g.id,
    label: g.label,
    slugs: g.slugs.filter((s) => !exclude.has(s)),
  })).filter((g) => g.slugs.length > 0);
}
