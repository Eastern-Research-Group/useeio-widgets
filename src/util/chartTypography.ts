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
export const CHART_EXPORT_EXTRA_HEIGHT_RANKED_PIE = 125;
export const CHART_EXPORT_EXTRA_HEIGHT_STACKED = 95;

/** Vertical band at chart bottom reserved for export disclaimer (stacked legend sits above). */
export const CHART_EXPORT_STACKED_DISCLAIMER_BAND = 46;

const APEX_AXIS_TITLE_LINE_LENGTH = 52;

function wrapApexLabelLines(
  text: string,
  maxLineLength: number,
  maxLines: number,
): string[] {
  const perBreak = text.indexOf(" per ");
  if (perBreak > 0 && maxLines >= 2) {
    const line1 = text.slice(0, perBreak);
    const line2 = text.slice(perBreak + 1);
    if (line1.length <= maxLineLength + 8) {
      return [line1, line2];
    }
  }

  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = "";
  let nextWordIndex = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const nextLine = currentLine ? `${currentLine} ${word}` : word;
    if (nextLine.length <= maxLineLength || currentLine.length === 0) {
      currentLine = nextLine;
      nextWordIndex = i + 1;
      continue;
    }

    lines.push(currentLine);
    currentLine = word;
    nextWordIndex = i + 1;

    if (lines.length === maxLines - 1) {
      break;
    }
  }

  const remainingText = [currentLine, ...words.slice(nextWordIndex)]
    .filter(Boolean)
    .join(" ");

  if (lines.length < maxLines && remainingText) {
    if (remainingText.length <= maxLineLength) {
      lines.push(remainingText);
    } else {
      lines.push(`${remainingText.slice(0, maxLineLength - 1).trimEnd()}...`);
    }
  }

  return lines.slice(0, maxLines);
}

/** Apex multiline axis text: pass a string array (see apexcharts.com/docs/multiline-text-and-line-breaks-in-axes-labels). */
export function apexAxisTitleText(title: string): string | string[] {
  if (title.length <= APEX_AXIS_TITLE_LINE_LENGTH) {
    return title;
  }
  const lines = wrapApexLabelLines(title, APEX_AXIS_TITLE_LINE_LENGTH, 2);
  return lines.length === 1 ? lines[0] : lines;
}

/** Shared y-axis title block for ranked + stacked bar charts. */
export function apexYAxisTitleConfig(title: string): {
  text?: string;
  offsetX: number;
  style: { fontSize: string; fontWeight: number };
} {
  const text = apexAxisTitleText(title);
  const multiline = Array.isArray(text);
  return {
    // ApexCharts accepts string[] at runtime for multiline titles; typings only list string.
    text: text as unknown as string,
    // Negative offset pulls the rotated title away from the plot so it is not covered by bars.
    offsetX: multiline ? -16 : 0,
    style: {
      fontSize: chartTypography.axisTitle,
      fontWeight: 600,
    },
  };
}

/** Multiline x-axis category labels (same Apex string-array convention). */
export function apexCategoryLabelLines(
  text: string,
  maxLineLength: number,
  maxLines: number,
): string[] {
  return wrapApexLabelLines(text, maxLineLength, maxLines);
}
