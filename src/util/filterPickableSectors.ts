import { normalizeSectorCodeBase } from "./util";

/**
 * BEA detail / special sectors kept in upstream `sectors.json` but not suitable
 * for the smart-sector search picker (no indicator rows, zero-only placeholders,
 * or non-industry buckets). Filter at runtime until excluded upstream.
 */
export const UNPICKABLE_SECTOR_CODES: ReadonlySet<string> = new Set([
  "331314", // Secondary smelting and alloying of aluminum — no impact rows
  "4200ID", // Customs duties
  "814000", // Private households — sparse / not meaningful for supply-chain views
  "S00101", // Federal electric utilities
  "S00201", // State and local government passenger transit
  "S00202", // State and local government electric utilities
  "S00300", // Noncomparable imports
  "S00401", // Scrap
  "S00402", // Used and secondhand goods
  "S00900", // Rest of the world adjustment
]);

export function isPickableSector<T extends { code: string }>(sector: T): boolean {
  return !UNPICKABLE_SECTOR_CODES.has(normalizeSectorCodeBase(sector.code));
}

/** Sectors shown in ranked / pie / dashboard search tables. */
export function filterPickableSectors<T extends { code: string }>(
  sectors: T[],
): T[] {
  return sectors.filter(isPickableSector);
}
