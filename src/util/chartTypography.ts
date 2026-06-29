/**
 * Shared font sizes for ApexCharts figures (SMCLCA bar charts).
 * Defaults are typically ~11px; these improve axis readability and data labels.
 */
export const chartTypography = {
  chartTitle: "16px",
  axisTitle: "16px",
  axisLabel: "14px",
  stackedBarTotal: "14px",
  annotationLabel: "15px",
} as const;

/** Slightly smaller type for PNG/SVG export (same 500px plot + title/footer reads crowded). */
export const chartExportTypography = {
  chartTitle: "13px",
  axisTitle: "12px",
  axisLabel: "11px",
  stackedBarTotal: "12px",
  annotationLabel: "11px",
  attribution: "10px",
} as const;

/** Extra plot height on the export chart so title/footer do not crush bars. */
export const CHART_EXPORT_EXTRA_HEIGHT_RANKED_PIE = 150;
export const CHART_EXPORT_EXTRA_HEIGHT_STACKED = 130;

/** Vertical band at chart bottom reserved for export disclaimer (stacked legend sits above). */
export const CHART_EXPORT_STACKED_DISCLAIMER_BAND = 52;
