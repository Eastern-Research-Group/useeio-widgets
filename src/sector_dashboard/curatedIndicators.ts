/**
 * Curated indicators shown together on the multi-indicator sector dashboard.
 * Each slug must exist under both JSON trees for the active model:
 * - `sector_contribution_to_impact_ranked/{final|direct}/{slug}.json`
 * - `percent_contribution_to_impact_by_sector/{final|direct}/{slug}.json`
 *
 * **Multi-select extension (future):** Replace this fixed array with React state
 * (e.g. checkboxes over `fileNames` from `util.ts`), cap selection count for
 * performance, and re-run chart init / destroy for added or removed sections.
 */
export const SECTOR_DASHBOARD_INDICATORS: readonly string[] = [
  "Acidification-Potential",
  "Eutrophication-Potential",
  "GWP-AR6-100",
  "Human-Health---Respiratory-Effects",
  "Smog-Formation-Potential",
  "Freshwater-withdrawals",
] as const;
