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
 * Per-indicator data extracted from the loaded charts to drive
 * a "mad-libs" interpretation paragraph.
 */
export interface SectorDashboardInterpretation {
  /** Share of impact from the sector's own operations (0–100). */
  directPercent: number;
  /** Share of impact from the supply chain (0–100). */
  indirectPercent: number;
  /** Top-N driver commodities/sources, in descending order. "Direct" and "All Others" filtered out. */
  topPurchases: string[];
}

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
    sectorName: SECTOR_NAME_TOKEN,
    sectorCode: input.sectorCode,
    perspectiveLabel: perspectiveLabel(input.perspective),
    barModeLabel: barModeLabel(input.barMode),
    pieModeLabel: pieModeLabel(input.pieMode),
    indicatorList,
  });
  return raw;
}

export function buildSectorDashboardSectionBlurb(
  _input: SectorDashboardNarrativeInput,
  indicatorSlug: string,
): string {
  return replacePlaceholders(PER_INDICATOR_TEMPLATE, {
    indicatorLabel: getLabel(indicatorSlug),
    sectorName: SECTOR_NAME_TOKEN,
  });
}

function formatPercent(p: number): string {
  if (!isFinite(p) || p < 0) {
    return "—";
  }
  return `${Math.round(p)}%`;
}

function joinList(items: string[]): string {
  if (items.length === 0) {
    return "";
  }
  if (items.length === 1) {
    return items[0];
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`;
  }
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function topContributorsClause(
  perspective: "final" | "direct",
  top: string[],
): string {
  if (top.length === 0) {
    return "";
  }
  const list = joinList(top);
  if (perspective === "final") {
    if (top.length === 1) {
      return ` The top purchase into this sector that drives this impact is ${list}.`;
    }
    return ` The top ${top.length} purchases into this sector that drive this impact are ${list}.`;
  }
  if (top.length === 1) {
    return ` The top supply chain contributor driving this impact is ${list}.`;
  }
  return ` The top ${top.length} supply chain contributors driving this impact are ${list}.`;
}

/**
 * Build a mad-libs interpretation sentence for one indicator, filling in
 * direct/indirect shares and the top driver purchases / sources.
 */
export function buildSectorDashboardInterpretation(
  input: SectorDashboardNarrativeInput,
  indicatorSlug: string,
  data: SectorDashboardInterpretation | null,
): string {
  const indicatorLabel = getLabel(indicatorSlug);
  if (!data) {
    return `Interpretation for ${indicatorLabel} will appear once data has loaded.`;
  }
  const directStr = formatPercent(data.directPercent);
  const indirectStr = formatPercent(data.indirectPercent);
  const topClause = topContributorsClause(input.perspective, data.topPurchases);
  return (
    `For ${indicatorLabel}, ${directStr} of the impact comes directly from ` +
    `${SECTOR_NAME_TOKEN}'s own operations, while ${indirectStr} comes from its ` +
    `supply chain.${topClause}`
  );
}
