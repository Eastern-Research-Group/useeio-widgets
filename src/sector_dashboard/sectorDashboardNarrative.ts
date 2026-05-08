import { getLabel } from "../util/util";
import { SECTOR_DASHBOARD_INDICATORS } from "./curatedIndicators";

/**
 * Marker token emitted in narrative strings wherever the active sector name
 * should appear. Render-time consumers replace this with bold+italic JSX
 * (see `sectorDashboardApp.tsx` `renderSectorNarrative`).
 */
export const SECTOR_NAME_TOKEN = "\u0001SECTOR_NAME\u0001";

export type SectorDashboardNarrativeInput = {
  sectorName: string;
  sectorCode: string;
  perspective: "final" | "direct";
  barMode: "impact_per_purchase" | "total_impact";
  pieMode: "aggregate" | "detail";
  /** Curated slugs (defaults to `SECTOR_DASHBOARD_INDICATORS`) */
  indicatorSlugs?: readonly string[];
};

/**
 * Replace `{placeholder}` tokens in a template string with values from `vars`.
 * Unknown tokens are left unchanged.
 */
export function replacePlaceholders(
  template: string,
  vars: Record<string, string>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    Object.prototype.hasOwnProperty.call(vars, key) ? vars[key] : `{${key}}`,
  );
}

const INTRO_TEMPLATE = [
  "This mini-report summarizes multiple environmental indicators for {sectorName} (BEA/NAICS {sectorCode}). ",
  "Results use the {perspectiveLabel} perspective. ",
  "Ranked bar charts show {barModeLabel}; pie charts use the {pieModeLabel} view. ",
  "Indicators included: {indicatorList}.",
].join("");

const PER_INDICATOR_TEMPLATE =
  "For {indicatorLabel}, the charts below show supplier contributions and the direct vs indirect impact shares for {sectorName} using the selections above.";

function perspectiveLabel(p: "final" | "direct"): string {
  return p === "final" ? "Point of consumption" : "Supply chain";
}

function barModeLabel(m: "impact_per_purchase" | "total_impact"): string {
  return m === "total_impact" ? "total sector impacts" : "impact intensity";
}

function pieModeLabel(m: "aggregate" | "detail"): string {
  return m === "aggregate"
    ? "simple (direct vs indirect)"
    : "detailed supplier slices";
}

/** Single source for on-screen copy and print snapshot (same strings). */
export function buildSectorDashboardIntro(input: SectorDashboardNarrativeInput): string {
  const slugs = input.indicatorSlugs ?? SECTOR_DASHBOARD_INDICATORS;
  const indicatorList = slugs.map((s) => getLabel(s)).join("; ");
  const raw = replacePlaceholders(INTRO_TEMPLATE, {
    sectorName: input.sectorName,
    sectorCode: input.sectorCode,
    perspectiveLabel: perspectiveLabel(input.perspective),
    barModeLabel: barModeLabel(input.barMode),
    pieModeLabel: pieModeLabel(input.pieMode),
    indicatorList,
  });
  return raw;
}

export function buildSectorDashboardSectionBlurb(
  input: SectorDashboardNarrativeInput,
  indicatorSlug: string,
): string {
  return replacePlaceholders(PER_INDICATOR_TEMPLATE, {
    indicatorLabel: getLabel(indicatorSlug),
    sectorName: input.sectorName,
  });
}
