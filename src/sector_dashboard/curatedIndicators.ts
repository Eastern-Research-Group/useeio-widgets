/**
 * Default indicators when the page loads without `?ind=`.
 * Each slug must exist under both JSON trees for the active model.
 */
export const SECTOR_DASHBOARD_INDICATORS: readonly string[] = [
  "Acidification-Potential",
  "Eutrophication-Potential",
  "GWP-AR6-100",
  "Human-Health---Respiratory-Effects",
  "Smog-Formation-Potential",
  "Freshwater-withdrawals",
] as const;
