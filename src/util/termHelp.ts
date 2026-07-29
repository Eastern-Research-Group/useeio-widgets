import * as React from "react";
import { SECTOR_PURCHASES_DIRECT_DISPLAY } from "./indicatorCatalog";

/**
 * Shared definition hover copy for Direct / Indirect / supply chain /
 * Within-sector spend across pie, ranked, and stacked chart pages.
 */

export type TermHelpId =
  | "direct"
  | "indirect"
  | "supplyChain"
  | "withinSectorSpend";

export type TermHelpEntry = {
  /** Default visible phrase inside the abbr */
  label: string;
  /** Native tooltip / title text */
  title: string;
};

export const TERM_HELP: Record<TermHelpId, TermHelpEntry> = {
  direct: {
    label: "Direct impacts",
    title: "Impacts from a sector's own operations.",
  },
  indirect: {
    label: "Indirect impacts",
    title: "Impacts from inputs purchased upstream.",
  },
  supplyChain: {
    label: "supply chain",
    title:
      "Network of sector purchases delivering goods and services.",
  },
  withinSectorSpend: {
    label: SECTOR_PURCHASES_DIRECT_DISPLAY,
    title:
      "Purchases within the same BEA sector code (not Direct facility impacts).",
  },
};

/** Escape text for use inside HTML attributes or element bodies. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** HTML `<abbr class="term-help">` for stacked page (and other non-React) intros. */
export function termHelpHtml(
  term: TermHelpId,
  displayText?: string,
): string {
  const entry = TERM_HELP[term];
  const visible = displayText ?? entry.label;
  return (
    `<abbr class="term-help" tabindex="0" title="${escapeHtml(entry.title)}">` +
    `${escapeHtml(visible)}</abbr>`
  );
}

export type TermHelpProps = {
  term: TermHelpId;
  /** Override visible text; defaults to TERM_HELP[term].label */
  children?: React.ReactNode;
};

/** React wrapper matching stacked `abbr.term-help` styling. */
export function TermHelp({
  term,
  children,
}: TermHelpProps): React.ReactElement {
  const entry = TERM_HELP[term];
  return React.createElement(
    "abbr",
    {
      className: "term-help",
      tabIndex: 0,
      title: entry.title,
    },
    children ?? entry.label,
  );
}

/** Closing clause shared by stacked intro paragraphs (with persistent abbrs). */
export function stackedEmbodiedImpactsClauseHtml(): string {
  return (
    `including contributions from ${termHelpHtml("direct")} due to the ` +
    `sector's operations and ${termHelpHtml("indirect")} embedded in purchases ` +
    `made from all other sectors in the ${termHelpHtml("supplyChain")}.`
  );
}

export type StackedIntroKind =
  | "construction"
  | "energy"
  | "snapshots"
  | "custom"
  | "top10_total"
  | "top25_total"
  | "top10_intensity"
  | "top25_intensity";

/** Full stacked intro HTML for a filter (keeps term-help abbrs after updates). */
export function stackedIntroParagraphHtml(kind: StackedIntroKind): string {
  const clause = stackedEmbodiedImpactsClauseHtml();
  switch (kind) {
    case "construction":
      return (
        `This chart presents select sectors for construction materials ranked ` +
        `by embodied impacts, ${clause}`
      );
    case "energy":
      return (
        `This chart presents select energy intensive sectors ranked by ` +
        `embodied impacts, ${clause}`
      );
    case "snapshots":
      return (
        `This chart presents select EPA Smart Sectors ranked by embodied ` +
        `impacts, ${clause}`
      );
    case "custom":
      return (
        `This chart presents the selected sectors ranked by embodied ` +
        `impacts, ${clause}`
      );
    case "top10_total":
      return (
        `This chart presents the top 10 sectors ranked by total embodied ` +
        `impacts, ${clause}`
      );
    case "top25_total":
      return (
        `This chart presents the top 25 sectors ranked by total embodied ` +
        `impacts, ${clause}`
      );
    case "top10_intensity":
      return (
        `This chart presents the top 10 sectors ranked by total embodied ` +
        `impact intensity, ${clause}`
      );
    case "top25_intensity":
      return (
        `This chart presents the top 25 sectors ranked by total embodied ` +
        `impact intensity, ${clause}`
      );
    default:
      return `This chart presents sectors ranked by embodied impacts, ${clause}`;
  }
}

/** Bundle for the global `useeio` API (stacked HTML page). */
export const termHelp = {
  TERM_HELP,
  termHelpHtml,
  stackedIntroParagraphHtml,
  stackedEmbodiedImpactsClauseHtml,
} as const;
