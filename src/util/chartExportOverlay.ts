import * as apex from "apexcharts";
import {
  apexCategoryLabelLines,
  chartExportTypography,
  CHART_EXPORT_EXTRA_HEIGHT_RANKED_PIE,
  CHART_EXPORT_EXTRA_HEIGHT_STACKED,
  CHART_EXPORT_STACKED_DISCLAIMER_BAND,
} from "./chartTypography";
import type { ChartExportFormat } from "./chartExportMenu";
import { getLabel } from "./util";

/** Apex is a webpack external (global from `lib/apexcharts.min.js`). */
declare const ApexCharts: new (
  el: Element,
  options: apex.ApexOptions,
) => ApexCharts;

/** Lines rendered at the bottom of PNG/SVG exports via `annotations.text`. */
export const CHART_EXPORT_ATTRIBUTION_LINES: readonly string[] = [
  "Source: U.S. EPA Sector Supply Chain Environmental Assessment Tool (v1.0).",
  "Indicative results; see glossary for methodology and data limitations.",
];

const CHART_EXPORT_LAYOUT_MS = 400;
const RANKED_EXPORT_AXIS_LINE_LENGTH = 13;
const RANKED_EXPORT_AXIS_MAX_LINES = 4;
const chartExportQueue = new WeakMap<ApexCharts, Promise<void>>();

/** Rebuild the on-screen chart after export (Apex can desync internal series state). */
export type ChartExportReapply = () => void | Promise<void>;

const ATTRIBUTION_MARKER = "Supply Chain Life Cycle Assessment Tool";

/** True when SVG text is export disclaimer copy (not the donut center total). */
export function isChartExportAttributionSvgText(text: string | null | undefined): boolean {
  return isAttributionAnnotationText(text);
}

export function sanitizeExportFilename(name: string): string {
  return name
    .replace(/[,:]/g, "")
    .replace(/[\/\\]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function buildSmartSectorExportTitle(
  sectorCode: string,
  sectorName: string,
  graphSlug: string,
  perspective: string,
): string {
  const indicator = getLabel(graphSlug);
  const perspectiveLabel =
    perspective === "final" ? "Point of Consumption" : "Supply Chain";
  return `Sector: ${sectorCode} - ${sectorName}, ${indicator}, ${perspectiveLabel}`;
}

export function buildSmartSectorExportFilename(
  sectorCode: string,
  graphSlug: string,
  perspective: string,
  exportFileSuffix: string,
): string {
  const indicator = getLabel(graphSlug);
  const perspectiveLabel =
    perspective === "final" ? "Point of Consumption" : "Supply Chain";
  return `${sectorCode} - ${indicator} - ${perspectiveLabel} - ${exportFileSuffix}`;
}

/** Two-line export title: sector line, then indicator + perspective. */
function splitExportTitleLines(title: string): string | string[] {
  const perspectiveMatch = title.match(/, (Point of Consumption|Supply Chain)$/);
  if (!perspectiveMatch) {
    return title;
  }
  const perspective = perspectiveMatch[1];
  const beforePerspective = title.slice(0, -perspectiveMatch[0].length);
  const lastComma = beforePerspective.lastIndexOf(", ");
  if (lastComma === -1) {
    return title;
  }
  const indicator = beforePerspective.slice(lastComma + 2);
  const sectorPart = beforePerspective.slice(0, lastComma + 1);
  return [sectorPart, `${indicator}, ${perspective}`];
}

function rewrapRankedExportCategories(
  categories: ApexXAxisCategories,
): ApexXAxisCategories {
  if (!categories || !Array.isArray(categories)) {
    return categories;
  }
  if (categories.length === 0) {
    return [];
  }
  const toLines = (label: string) =>
    apexCategoryLabelLines(
      label,
      RANKED_EXPORT_AXIS_LINE_LENGTH,
      RANKED_EXPORT_AXIS_MAX_LINES,
    );
  if (typeof categories[0] === "string") {
    return (categories as string[]).map(toLines);
  }
  return (categories as string[][]).map((lines) =>
    toLines(lines.join(" ")),
  );
}

function clearPieExportTitle(options: apex.ApexOptions): apex.ApexOptions {
  return {
    ...options,
    title: { text: "" },
  };
}

/** On-screen pie options after export (export title and cartesian axes removed). */
export function preparePieChartOptionsForDisplay(
  options: apex.ApexOptions,
): apex.ApexOptions {
  const prepared = clearPieExportTitle({ ...options });
  delete prepared.xaxis;
  delete prepared.yaxis;
  ensureApexExportTooltipSafe(prepared);
  return prepared;
}

function chartHeightFromOptions(options: apex.ApexOptions): number {
  const h = options.chart?.height;
  return typeof h === "number" ? h : 500;
}

function chartWidthFromOptions(options: apex.ApexOptions): number {
  const w = options.chart?.width;
  return typeof w === "number" ? w : 800;
}

function isAttributionAnnotationText(text: unknown): boolean {
  if (text == null) {
    return false;
  }
  const s = String(text);
  return (
    s.includes(ATTRIBUTION_MARKER) ||
    CHART_EXPORT_ATTRIBUTION_LINES.some(
      (line) => s.length > 0 && s.includes(line.slice(0, 20)),
    )
  );
}

type ExportAttributionText = {
  x: number;
  y: number;
  text: string;
  textAnchor: "start";
  foreColor: string;
  fontSize: string;
  fontFamily: string;
  borderWidth: number;
};

function buildExportAttributionAnnotationTexts(
  chartHeight: number,
): ExportAttributionText[] {
  const lineHeight = 14;
  const bottomPad = 10;
  const startY =
    chartHeight - bottomPad - CHART_EXPORT_ATTRIBUTION_LINES.length * lineHeight;
  return CHART_EXPORT_ATTRIBUTION_LINES.map((text, i) => ({
    x: 12,
    y: startY + i * lineHeight,
    text,
    textAnchor: "start",
    foreColor: "#444444",
    fontSize: chartExportTypography.attribution,
    fontFamily: "Helvetica, Arial, sans-serif",
    borderWidth: 0,
  }));
}

function mapYaxisExportTypography(
  yaxis: apex.ApexOptions["yaxis"],
): apex.ApexOptions["yaxis"] {
  if (!yaxis) {
    return yaxis;
  }
  const mapOne = (axis: Record<string, unknown>): Record<string, unknown> => {
    const title = axis.title as { style?: { fontSize?: string } } | undefined;
    const labels = axis.labels as { style?: { fontSize?: string } } | undefined;
    return {
      ...axis,
      ...(title
        ? {
            title: {
              ...title,
              style: {
                ...title.style,
                fontSize: chartExportTypography.axisTitle,
              },
            },
          }
        : {}),
      ...(labels
        ? {
            labels: {
              ...labels,
              style: {
                ...labels.style,
                fontSize: chartExportTypography.axisLabel,
              },
            },
          }
        : {}),
    };
  };
  if (Array.isArray(yaxis)) {
    return yaxis.map((axis) => mapOne(axis as Record<string, unknown>)) as apex.ApexOptions["yaxis"];
  }
  return mapOne(yaxis as Record<string, unknown>) as apex.ApexOptions["yaxis"];
}

type ApexYAxisConfig = NonNullable<
  Extract<apex.ApexOptions["yaxis"], readonly unknown[]>[number]
>;

type ApexXAxisCategories = NonNullable<apex.ApexOptions["xaxis"]>["categories"];

function flattenXAxisCategories(
  categories: ApexXAxisCategories,
): string[] | undefined {
  if (!categories || !Array.isArray(categories)) {
    return categories as string[] | undefined;
  }
  if (categories.length === 0) {
    return [];
  }
  if (typeof categories[0] === "string") {
    return categories as string[];
  }
  return (categories as string[][]).map((lines) => lines.join(" "));
}

/** Ranked bars: match on-screen wrapped horizontal category labels in export. */
function applyRankedExportXAxisLayout(
  options: apex.ApexOptions,
): apex.ApexOptions {
  if (!options.xaxis || isPieOrDonutChart(options)) {
    return options;
  }
  return {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: rewrapRankedExportCategories(options.xaxis.categories),
      labels: {
        ...options.xaxis.labels,
        rotate: 0,
        rotateAlways: false,
        trim: false,
        hideOverlappingLabels: false,
        minHeight: 80,
        maxHeight: 120,
        style: {
          ...options.xaxis.labels?.style,
          fontSize: chartExportTypography.axisLabel,
        },
      },
    },
    grid: {
      ...options.grid,
      padding: {
        ...options.grid?.padding,
        bottom: Math.max(
          typeof options.grid?.padding?.bottom === "number"
            ? options.grid.padding.bottom
            : 0,
          64,
        ),
      },
    },
  };
}

/** Stacked bars: rotate dense sector labels so exports do not overlap. */
function applyStackedExportXAxisLayout(
  options: apex.ApexOptions,
): apex.ApexOptions {
  if (!options.xaxis || isPieOrDonutChart(options)) {
    return options;
  }
  return {
    ...options,
    xaxis: {
      ...options.xaxis,
      categories: flattenXAxisCategories(options.xaxis.categories),
      labels: {
        ...options.xaxis.labels,
        rotate: -45,
        rotateAlways: true,
        trim: false,
        hideOverlappingLabels: false,
        minHeight: 56,
        maxHeight: 96,
        style: {
          ...options.xaxis.labels?.style,
          fontSize: chartExportTypography.axisLabel,
        },
      },
    },
    grid: {
      ...options.grid,
      padding: {
        ...options.grid?.padding,
        bottom: Math.max(
          typeof options.grid?.padding?.bottom === "number"
            ? options.grid.padding.bottom
            : 0,
          76,
        ),
      },
    },
  };
}

function preserveMultilineAxisTextFromSource(
  source: apex.ApexOptions,
  target: apex.ApexOptions,
  chartKind: "ranked" | "stacked",
): void {
  if (source.xaxis?.categories && target.xaxis && chartKind === "stacked") {
    target.xaxis.categories = flattenXAxisCategories(source.xaxis.categories);
  }

  const srcY = source.yaxis;
  const tgtY = target.yaxis;
  if (!srcY || !tgtY) {
    return;
  }
  const srcArr = (Array.isArray(srcY) ? srcY : [srcY]) as ApexYAxisConfig[];
  const tgtArr = (Array.isArray(tgtY) ? tgtY : [tgtY]) as ApexYAxisConfig[];
  srcArr.forEach((axis, i) => {
    const srcTitle = axis?.title;
    const tgtTitle = tgtArr[i]?.title;
    if (srcTitle?.text != null && tgtTitle) {
      tgtTitle.text = srcTitle.text as unknown as string;
    }
  });
}

function yAxisTitleLines(titleText: unknown): string[] {
  if (titleText == null) {
    return [];
  }
  if (Array.isArray(titleText)) {
    return titleText.map(String);
  }
  return [String(titleText)];
}

/** Rotated y-axis titles need extra left inset in raster export (PNG clips SVG at x=0). */
function exportYAxisLeftPadding(lines: string[]): number {
  if (lines.length === 0) {
    return 16;
  }
  const longest = Math.max(...lines.map((line) => line.length));
  return Math.min(36, Math.max(16, Math.round(longest * 1.4)));
}

function applyExportYAxisClearance(options: apex.ApexOptions): apex.ApexOptions {
  if (isPieOrDonutChart(options) || !options.yaxis) {
    return options;
  }

  const adjustAxis = (axis: ApexYAxisConfig): ApexYAxisConfig => {
    if (!axis.title) {
      return axis;
    }
    return {
      ...axis,
      title: {
        ...axis.title,
        // On-screen negative offset keeps titles off bars; export needs x >= 0.
        offsetX: 0,
      },
    };
  };

  const yaxis = options.yaxis;
  const adjusted = Array.isArray(yaxis)
    ? yaxis.map((axis) => adjustAxis(axis as ApexYAxisConfig))
    : adjustAxis(yaxis as ApexYAxisConfig);
  const primaryAxis = Array.isArray(adjusted) ? adjusted[0] : adjusted;
  const leftPad = exportYAxisLeftPadding(
    yAxisTitleLines(primaryAxis?.title?.text),
  );

  return {
    ...options,
    yaxis: adjusted as apex.ApexOptions["yaxis"],
    grid: {
      ...options.grid,
      padding: {
        ...options.grid?.padding,
        left: Math.max(
          typeof options.grid?.padding?.left === "number"
            ? options.grid.padding.left
            : 0,
          leftPad,
        ),
      },
    },
  };
}

/** Smaller fonts + taller canvas for PNG/SVG export (on-screen figure unchanged). */
function applyExportRasterTypography(
  options: apex.ApexOptions,
  extraHeight: number,
): apex.ApexOptions {
  const baseHeight = chartHeightFromOptions(options);
  const yaxisAnnotations = options.annotations?.yaxis?.map((entry) => ({
    ...entry,
    label: entry.label
      ? {
          ...entry.label,
          style: {
            ...entry.label.style,
            fontSize: chartExportTypography.annotationLabel,
          },
        }
      : entry.label,
  }));

  const plotBar = options.plotOptions?.bar as
    | {
        dataLabels?: {
          total?: { style?: { fontSize?: string } };
        };
      }
    | undefined;

  const isPie = isPieOrDonutChart(options);

  return {
    ...options,
    chart: {
      ...options.chart,
      height: baseHeight + extraHeight,
    },
    title: options.title?.text
      ? {
          ...options.title,
          margin: 6,
          style: {
            ...options.title.style,
            fontSize: chartExportTypography.chartTitle,
          },
        }
      : options.title,
    xaxis: isPie
      ? options.xaxis
      : options.xaxis
        ? {
            ...options.xaxis,
            labels: {
              ...options.xaxis.labels,
              style: {
                ...options.xaxis.labels?.style,
                fontSize: chartExportTypography.axisLabel,
              },
            },
          }
        : options.xaxis,
    yaxis: isPie ? options.yaxis : mapYaxisExportTypography(options.yaxis),
    legend: options.legend
      ? {
          ...options.legend,
          fontSize: chartExportTypography.axisLabel,
        }
      : options.legend,
    annotations:
      yaxisAnnotations || options.annotations?.texts
        ? {
            ...options.annotations,
            ...(yaxisAnnotations ? { yaxis: yaxisAnnotations } : {}),
          }
        : options.annotations,
    plotOptions: plotBar?.dataLabels?.total
      ? {
          ...options.plotOptions,
          bar: {
            ...plotBar,
            dataLabels: {
              ...plotBar.dataLabels,
              total: {
                ...plotBar.dataLabels?.total,
                style: {
                  ...plotBar.dataLabels?.total?.style,
                  fontSize: chartExportTypography.stackedBarTotal,
                },
              },
            },
          },
        }
      : options.plotOptions,
  };
}

function stripExportOverlayFromOptions(
  baseOptions: apex.ApexOptions,
): apex.ApexOptions {
  const baseTexts = baseOptions.annotations?.texts ?? [];
  const liveTexts = baseTexts.filter(
    (t) => !isAttributionAnnotationText(t.text),
  );

  if (!baseOptions.annotations) {
    return { ...baseOptions };
  }

  return {
    ...baseOptions,
    annotations: {
      ...baseOptions.annotations,
      texts: liveTexts,
    },
    grid: baseOptions.grid,
  };
}

/**
 * Deep clone before export render. Apex mutates `series` in place; sharing
 * references with the visible chart caused missing/gapped stacked bars after export.
 */
function cloneApexOptionsForExport(source: apex.ApexOptions): apex.ApexOptions {
  const cloned = JSON.parse(JSON.stringify(source)) as apex.ApexOptions;
  copyChartFormatterRefs(source, cloned);
  ensureApexExportTooltipSafe(cloned, source);
  patchPieDonutLabelsForExport(source, cloned);
  stripCartesianAxesForPieExport(cloned);
  return cloned;
}

/** JSON clone and Apex init require x/y/z tooltip formatters (and pie cartesian stubs). */
function ensureApexExportTooltipSafe(
  target: apex.ApexOptions,
  source?: apex.ApexOptions,
): void {
  const passThrough = (val: number) => String(val);
  const srcTip = source?.tooltip as
    | {
        x?: { formatter?: (val: number) => string };
        y?: { formatter?: (val: number) => string };
        z?: { formatter?: (val: number) => string };
      }
    | undefined;

  if (!target.tooltip) {
    target.tooltip = {
      x: { formatter: srcTip?.x?.formatter ?? passThrough },
      y: { formatter: srcTip?.y?.formatter ?? passThrough },
      z: { formatter: srcTip?.z?.formatter ?? passThrough },
    };
    return;
  }

  const tip = target.tooltip as {
    x?: { formatter?: (val: number) => string };
    y?: { formatter?: (val: number) => string };
    z?: { formatter?: (val: number) => string };
  };
  if (!tip.x || typeof tip.x !== "object") {
    tip.x = { formatter: srcTip?.x?.formatter ?? passThrough };
  } else if (!tip.x.formatter) {
    tip.x.formatter = srcTip?.x?.formatter ?? passThrough;
  }
  if (!tip.y || typeof tip.y !== "object") {
    tip.y = { formatter: srcTip?.y?.formatter ?? passThrough };
  } else if (!tip.y.formatter) {
    tip.y.formatter = srcTip?.y?.formatter ?? passThrough;
  }
  if (!tip.z || typeof tip.z !== "object") {
    tip.z = { formatter: srcTip?.z?.formatter ?? passThrough };
  } else if (!tip.z.formatter) {
    tip.z.formatter = srcTip?.z?.formatter ?? passThrough;
  }
}

/** Minimal xaxis/yaxis/tooltip formatters required by ApexCharts init for pie/donut. */
function neutralizeCartesianAxesForPie(options: apex.ApexOptions): void {
  const passThrough = (val: number) => String(val);
  options.xaxis = {
    labels: { formatter: passThrough },
    tooltip: { formatter: passThrough },
  } as unknown as apex.ApexOptions["xaxis"];
  const series = options.series;
  const yaxisCount =
    Array.isArray(series) && series.length > 0 && typeof series[0] === "number"
      ? series.length
      : 1;
  options.yaxis = Array.from({ length: yaxisCount }, () => ({
    labels: { formatter: passThrough },
  }));
  ensureApexExportTooltipSafe(options);
}

function stripCartesianAxesForPieExport(options: apex.ApexOptions): void {
  const series = options.series;
  const pieLikeSeries =
    Array.isArray(series) &&
    series.length > 0 &&
    typeof series[0] === "number";
  if (!isPieOrDonutChart(options) && !pieLikeSeries) {
    return;
  }
  neutralizeCartesianAxesForPie(options);
}

type DonutLabelSlot = {
  show?: boolean;
  formatter?: (...args: unknown[]) => string;
};

type DonutLabels = {
  show?: boolean;
  name?: DonutLabelSlot;
  value?: DonutLabelSlot;
  total?: DonutLabelSlot & { label?: string };
};

function isPieOrDonutChart(options: apex.ApexOptions): boolean {
  const t = options.chart?.type;
  return t === "pie" || t === "donut";
}

/**
 * JSON clone drops donut label formatters. Supply defaults and hide inner labels on export;
 * center total remains in `annotations.texts`.
 */
function patchPieDonutLabelsForExport(
  source: apex.ApexOptions,
  target: apex.ApexOptions,
): void {
  if (!isPieOrDonutChart(target)) {
    return;
  }
  const srcPie = source.plotOptions?.pie as
    | { donut?: { labels?: DonutLabels } }
    | undefined;
  const tgtPie = target.plotOptions?.pie as
    | { donut?: { labels?: DonutLabels } }
    | undefined;
  if (!tgtPie?.donut) {
    return;
  }

  const srcLabels = srcPie?.donut?.labels;
  const tgtLabels = tgtPie.donut.labels ?? {};
  const nameFormatter =
    srcLabels?.name?.formatter ??
    tgtLabels.name?.formatter ??
    ((v: unknown) => String(v ?? ""));
  const valueFormatter =
    srcLabels?.value?.formatter ??
    tgtLabels.value?.formatter ??
    ((v: unknown) => String(v ?? ""));
  const totalFormatter =
    srcLabels?.total?.formatter ?? tgtLabels.total?.formatter ?? (() => "");

  tgtPie.donut.labels = {
    ...tgtLabels,
    show: tgtLabels.show ?? true,
    name: {
      ...tgtLabels.name,
      show: false,
      formatter: nameFormatter,
    },
    value: {
      ...tgtLabels.value,
      show: false,
      formatter: valueFormatter,
    },
    total: {
      ...tgtLabels.total,
      show: false,
      label: tgtLabels.total?.label ?? "Total",
      formatter: totalFormatter,
    },
  };
}

function copyChartFormatterRefs(
  source: apex.ApexOptions,
  target: apex.ApexOptions,
): void {
  type BarPlotOptions = {
    dataLabels?: {
      total?: { formatter?: (val: unknown) => string };
    };
  };
  type PiePlotOptions = {
    donut?: {
      labels?: {
        value?: { formatter?: (val: unknown) => string };
      };
    };
  };

  const srcBar = source.plotOptions?.bar as BarPlotOptions | undefined;
  const tgtBar = target.plotOptions?.bar as BarPlotOptions | undefined;
  if (srcBar?.dataLabels?.total?.formatter && tgtBar?.dataLabels?.total) {
    tgtBar.dataLabels.total.formatter = srcBar.dataLabels.total.formatter;
  }

  const srcPie = source.plotOptions?.pie as PiePlotOptions | undefined;
  const tgtPie = target.plotOptions?.pie as PiePlotOptions | undefined;
  if (srcPie?.donut?.labels?.value?.formatter && tgtPie?.donut?.labels?.value) {
    tgtPie.donut.labels.value.formatter = srcPie.donut.labels.value.formatter;
  }

  const srcY = source.yaxis;
  const tgtY = target.yaxis;
  if (srcY && tgtY) {
    const srcArr = Array.isArray(srcY) ? srcY : [srcY];
    const tgtArr = Array.isArray(tgtY) ? tgtY : [tgtY];
    srcArr.forEach((axis, i) => {
      const formatter = axis?.labels?.formatter;
      if (formatter && tgtArr[i]?.labels) {
        tgtArr[i].labels!.formatter = formatter;
      }
      const srcTitle = axis?.title;
      const tgtTitle = tgtArr[i]?.title;
      if (srcTitle?.text != null && tgtTitle) {
        tgtTitle.text = srcTitle.text as unknown as string;
      }
      if (typeof srcTitle?.offsetX === "number" && tgtTitle) {
        tgtTitle.offsetX = srcTitle.offsetX;
      }
    });
  }

  if (source.xaxis?.categories && target.xaxis) {
    target.xaxis.categories = JSON.parse(
      JSON.stringify(source.xaxis.categories),
    ) as ApexXAxisCategories;
  }

  const srcTooltipY = source.tooltip?.y;
  const tgtTooltipY = target.tooltip?.y;
  if (
    srcTooltipY &&
    tgtTooltipY &&
    !Array.isArray(srcTooltipY) &&
    !Array.isArray(tgtTooltipY) &&
    srcTooltipY.formatter
  ) {
    tgtTooltipY.formatter = srcTooltipY.formatter;
  }
}

async function waitChartPaint(): Promise<void> {
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

/** Pie UI toggles `visibility` on the last SVG text node; export must show all labels. */
function revealChartSvgText(container: Element | null | undefined): void {
  if (!container) {
    return;
  }
  container.querySelectorAll("svg text").forEach((node) => {
    node.removeAttribute("visibility");
  });
}

function createOffscreenExportHost(
  options: apex.ApexOptions,
): HTMLDivElement {
  const width = chartWidthFromOptions(options);
  const height = chartHeightFromOptions(options);
  const host = document.createElement("div");
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position:fixed",
    "left:-20000px",
    "top:0",
    `width:${width}px`,
    `height:${height}px`,
    "overflow:hidden",
    "opacity:0",
    "pointer-events:none",
  ].join(";");
  document.body.appendChild(host);
  return host;
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function parseSvgWidth(svg: string): number {
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/);
    if (parts.length >= 3) {
      const w = parseFloat(parts[2]);
      if (!Number.isNaN(w)) {
        return w;
      }
    }
  }
  const wMatch = svg.match(/\bwidth=["']([0-9.]+)/);
  if (wMatch) {
    return parseFloat(wMatch[1]);
  }
  return 800;
}

function parseSvgHeight(svg: string): number {
  const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/);
    if (parts.length >= 4) {
      const h = parseFloat(parts[3]);
      if (!Number.isNaN(h)) {
        return h;
      }
    }
  }
  const hMatch = svg.match(/\bheight=["']([0-9.]+)/);
  if (hMatch) {
    return parseFloat(hMatch[1]);
  }
  return 500;
}

function resizeSvgRoot(svg: string, width: number, height: number): string {
  let out = svg;
  if (/\bheight=["'][0-9.]+["']/.test(out)) {
    out = out.replace(/\bheight=["'][0-9.]+["']/, `height="${height}"`);
  }
  if (/\bwidth=["'][0-9.]+["']/.test(out)) {
    out = out.replace(/\bwidth=["'][0-9.]+["']/, `width="${width}"`);
  }
  if (/viewBox=["'][^"']+["']/.test(out)) {
    out = out.replace(/viewBox=["']([^"']+)["']/, (_match, vb: string) => {
      const parts = vb.trim().split(/[\s,]+/);
      while (parts.length < 4) {
        parts.push("0");
      }
      parts[2] = String(width);
      parts[3] = String(height);
      return `viewBox="${parts.join(" ")}"`;
    });
  } else {
    out = out.replace(/<svg/, `<svg viewBox="0 0 ${width} ${height}"`);
  }
  return out;
}

/** Extend SVG canvas downward and append disclaimer lines (matches PNG composite layout). */
function appendAttributionToSvgMarkup(
  svg: string,
  lines: readonly string[],
): string {
  const lineHeight = 14;
  const padX = 12;
  const padY = 10;
  const footerHeight = lines.length * lineHeight + padY * 2;
  const width = parseSvgWidth(svg);
  const chartHeight = parseSvgHeight(svg);
  const totalHeight = chartHeight + footerHeight;
  const attrFont = chartExportTypography.attribution;
  const fontPx = parseInt(attrFont, 10) || 10;
  const startY = chartHeight + padY + fontPx;

  const texts = lines
    .map(
      (line, i) =>
        `<text x="${padX}" y="${startY + i * lineHeight}" ` +
        `font-family="Helvetica, Arial, sans-serif" font-size="${attrFont}" ` +
        `fill="#444444">${escapeXml(line)}</text>`,
    )
    .join("");
  const group = `<g class="chart-export-attribution">${texts}</g>`;
  const close = svg.lastIndexOf("</svg>");
  if (close === -1) {
    return svg;
  }
  const withGroup = `${svg.slice(0, close)}${group}${svg.slice(close)}`;
  return resizeSvgRoot(withGroup, width, totalHeight);
}

/** Apex `svgUrl()` returns an object URL; read the serialized SVG markup from it. */
async function readChartSvgMarkup(exportChart: ApexCharts): Promise<string> {
  const exportsApi = exportChart.exports as unknown as {
    getSvgString?: (scale?: number) => string;
    svgUrl: () => string;
  };
  if (typeof exportsApi.getSvgString === "function") {
    return exportsApi.getSvgString();
  }
  const blobUrl = exportsApi.svgUrl();
  try {
    const response = await fetch(blobUrl);
    return await response.text();
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/** Apex donut charts often omit `annotations.texts` from raster output; paint footer in canvas. */
async function compositePngDataUriWithAttribution(
  imgURI: string,
  lines: readonly string[],
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const lineHeight = 14;
      const padX = 12;
      const padY = 10;
      const footerHeight = lines.length * lineHeight + padY * 2;
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height + footerHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("canvas 2d unavailable"));
        return;
      }
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const fontPx = parseInt(chartExportTypography.attribution, 10) || 10;
      ctx.fillStyle = "#444444";
      ctx.font = `${fontPx}px Helvetica, Arial, sans-serif`;
      lines.forEach((line, i) => {
        ctx.fillText(line, padX, height + padY + (i + 1) * lineHeight - 4);
      });
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("chart image load failed"));
    img.src = imgURI;
  });
}

async function triggerPngDownload(
  exportChart: ApexCharts,
  filename: string,
  footerLines?: readonly string[],
): Promise<void> {
  const result = await exportChart.dataURI();
  const safeName = sanitizeExportFilename(filename);

  if (footerLines?.length) {
    let imgURI: string | undefined;
    if ("imgURI" in result && result.imgURI) {
      imgURI = result.imgURI;
    } else if ("blob" in result && result.blob) {
      imgURI = await blobToDataUrl(result.blob);
    }
    if (!imgURI) {
      return;
    }
    const withFooter = await compositePngDataUriWithAttribution(
      imgURI,
      footerLines,
    );
    exportChart.exports.triggerDownload(withFooter, safeName, ".png");
    return;
  }

  if ("blob" in result && result.blob && typeof navigator !== "undefined") {
    const nav = navigator as Navigator & {
      msSaveOrOpenBlob?: (blob: Blob, name: string) => void;
    };
    if (nav.msSaveOrOpenBlob) {
      nav.msSaveOrOpenBlob(result.blob, `${safeName}.png`);
      return;
    }
  }
  if ("imgURI" in result && result.imgURI) {
    exportChart.exports.triggerDownload(result.imgURI, safeName, ".png");
  }
}

async function triggerSvgDownload(
  exportChart: ApexCharts,
  filename: string,
  footerLines?: readonly string[],
): Promise<void> {
  const safeName = sanitizeExportFilename(filename);
  if (footerLines?.length) {
    const rawSvg = await readChartSvgMarkup(exportChart);
    const svg = appendAttributionToSvgMarkup(rawSvg, footerLines);
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    try {
      exportChart.exports.triggerDownload(url, safeName, ".svg");
    } finally {
      URL.revokeObjectURL(url);
    }
    return;
  }
  exportChart.exports.triggerDownload(
    exportChart.exports.svgUrl(),
    safeName,
    ".svg",
  );
}

function stripAttributionTextsFromOptions(options: apex.ApexOptions): void {
  const texts = options.annotations?.texts;
  if (!texts?.length) {
    return;
  }
  const without = texts.filter((t) => !isAttributionAnnotationText(t.text));
  if (without.length === 0) {
    delete options.annotations;
    return;
  }
  options.annotations = { ...options.annotations, texts: without };
}

/** Pie/donut PNG/SVG: apply export overlay to the visible chart, then download. */
async function exportFromLivePieChart(
  liveChart: ApexCharts,
  overlayOptions: apex.ApexOptions,
  type: ChartExportFormat,
  filename: string,
): Promise<void> {
  const exportOpts = cloneApexOptionsForExport(overlayOptions);
  patchPieDonutLabelsForExport(overlayOptions, exportOpts);
  neutralizeCartesianAxesForPie(exportOpts);
  if (exportOpts.chart && "events" in exportOpts.chart) {
    const chart = { ...exportOpts.chart };
    delete (chart as { events?: unknown }).events;
    exportOpts.chart = chart;
  }
  delete exportOpts.responsive;
  stripAttributionTextsFromOptions(exportOpts);

  await liveChart.updateOptions(exportOpts, false, true);
  await waitChartPaint();
  await new Promise<void>((resolve) =>
    setTimeout(resolve, CHART_EXPORT_LAYOUT_MS),
  );
  revealChartSvgText((liveChart as ApexCharts & { el: Element }).el);

  if (type === "png") {
    await triggerPngDownload(
      liveChart,
      filename,
      CHART_EXPORT_ATTRIBUTION_LINES,
    );
  } else if (type === "svg") {
    await triggerSvgDownload(
      liveChart,
      filename,
      CHART_EXPORT_ATTRIBUTION_LINES,
    );
  }
}

/**
 * Render export options on a disposable off-screen chart and download from it.
 * Used for ranked and stacked bar charts so the visible chart is not modified.
 */
async function exportFromDetachedChart(
  overlayOptions: apex.ApexOptions,
  type: ChartExportFormat,
  filename: string,
  csvSeries?: apex.ApexOptions["series"],
): Promise<void> {
  ensureApexExportTooltipSafe(overlayOptions);
  if (overlayOptions.chart && "events" in overlayOptions.chart) {
    const chart = { ...overlayOptions.chart };
    delete (chart as { events?: unknown }).events;
    overlayOptions.chart = chart;
  }
  delete overlayOptions.responsive;

  const host = createOffscreenExportHost(overlayOptions);
  const exportChart = new ApexCharts(host, overlayOptions);

  try {
    await exportChart.render();
    await waitChartPaint();
    await new Promise<void>((resolve) =>
      setTimeout(resolve, CHART_EXPORT_LAYOUT_MS),
    );

    if (type === "png") {
      await triggerPngDownload(exportChart, filename);
    } else if (type === "svg") {
      await triggerSvgDownload(exportChart, filename);
    } else if (type === "csv") {
      exportChart.exports.exportToCSV({
        series: csvSeries ?? overlayOptions.series,
        columnDelimiter: ",",
        fileName: sanitizeExportFilename(filename),
      });
    }
  } finally {
    exportChart.destroy();
    host.remove();
  }
}

/** Stacked charts use a bottom legend; shift it above the export disclaimer band. */
function applyStackedExportLegendClearance(
  options: apex.ApexOptions,
): apex.ApexOptions {
  const band = CHART_EXPORT_STACKED_DISCLAIMER_BAND;
  const leg = options.legend;
  const nextLegend =
    leg && !Array.isArray(leg)
      ? {
          ...leg,
          offsetY:
            (typeof leg.offsetY === "number" ? leg.offsetY : 0) - Math.round(band * 0.35),
        }
      : leg;

  return {
    ...options,
    legend: nextLegend,
    grid: {
      ...options.grid,
      padding: {
        ...options.grid?.padding,
        bottom: Math.max(
          typeof options.grid?.padding?.bottom === "number"
            ? options.grid.padding.bottom
            : 0,
          band,
        ),
      },
    },
  };
}

function mergeExportOverlayIntoOptions(
  baseOptions: apex.ApexOptions,
  title: string,
  exportFileBase: string,
): apex.ApexOptions {
  const isolated = cloneApexOptionsForExport(baseOptions);
  const live = stripExportOverlayFromOptions(isolated);
  const safeName = sanitizeExportFilename(exportFileBase);

  const merged = applyExportRasterTypography(
    {
      ...live,
      chart: {
        ...live.chart,
        animations: { enabled: false },
        toolbar: {
          show: false,
          tools: {
            download: false,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
          export: {
            csv: {
              filename: safeName,
              columnDelimiter: ",",
              headerCategory: "Sector Purchased",
              headerValue: "Contribution",
            },
            svg: { filename: safeName },
            png: { filename: safeName },
          },
        },
      },
      title: {
        ...live.title,
        text: title,
        style: {
          ...live.title?.style,
          fontSize: chartExportTypography.chartTitle,
        },
      },
    },
    CHART_EXPORT_EXTRA_HEIGHT_RANKED_PIE,
  );

  merged.title = {
    ...merged.title,
    text: splitExportTitleLines(title) as unknown as string,
    align: "left",
    margin: 8,
    style: {
      ...merged.title?.style,
      fontSize: chartExportTypography.chartTitle,
      fontWeight: 600,
    },
  };

  const exportHeight = chartHeightFromOptions(merged);
  const existingTexts = merged.annotations?.texts ?? [];
  const pieExport = isPieOrDonutChart(merged);
  const attributionTexts = pieExport
    ? []
    : buildExportAttributionAnnotationTexts(exportHeight);

  const result: apex.ApexOptions = applyRankedExportXAxisLayout({
    ...merged,
    grid: {
      ...merged.grid,
      padding: {
        ...merged.grid?.padding,
        bottom: Math.max(
          typeof merged.grid?.padding?.bottom === "number"
            ? merged.grid.padding.bottom
            : 0,
          pieExport ? 20 : 56,
        ),
      },
    },
    annotations: {
      ...merged.annotations,
      texts: [...existingTexts, ...attributionTexts],
    },
  });
  preserveMultilineAxisTextFromSource(baseOptions, result, "ranked");
  patchPieDonutLabelsForExport(baseOptions, result);
  stripCartesianAxesForPieExport(result);
  return applyExportYAxisClearance(result);
}

function appendExportAttributionToOptions(
  baseOptions: apex.ApexOptions,
): apex.ApexOptions {
  const isolated = cloneApexOptionsForExport(baseOptions);
  const live = stripExportOverlayFromOptions(isolated);

  const merged = applyExportRasterTypography(
    {
      ...live,
      chart: {
        ...live.chart,
        animations: { enabled: false },
      },
    },
    CHART_EXPORT_EXTRA_HEIGHT_STACKED,
  );

  const exportHeight = chartHeightFromOptions(merged);
  const existingTexts = merged.annotations?.texts ?? [];

  const result = applyStackedExportLegendClearance(
    applyStackedExportXAxisLayout({
      ...merged,
      grid: {
        ...merged.grid,
        padding: {
          ...merged.grid?.padding,
          bottom: Math.max(
            typeof merged.grid?.padding?.bottom === "number"
              ? merged.grid.padding.bottom
              : 0,
            48,
          ),
        },
      },
      annotations: {
        ...merged.annotations,
        texts: [
          ...existingTexts,
          ...buildExportAttributionAnnotationTexts(exportHeight),
        ],
      },
    }),
  );
  preserveMultilineAxisTextFromSource(baseOptions, result, "stacked");
  return applyExportYAxisClearance(result);
}

export function stackedChartExportFileBase(
  options: apex.ApexOptions,
): string {
  const fromToolbar =
    options.chart?.toolbar?.export?.png?.filename ??
    options.chart?.toolbar?.export?.svg?.filename;
  if (fromToolbar && String(fromToolbar).length > 0) {
    return String(fromToolbar);
  }
  const title = options.title?.text;
  return title ? sanitizeExportFilename(String(title)) : "smart-sector-chart";
}

async function reapplyApexChartOptions(
  chart: ApexCharts,
  liveOptions: apex.ApexOptions,
): Promise<void> {
  const fresh = cloneApexOptionsForExport(liveOptions);
  await chart.updateOptions(fresh, false, true);
  if (fresh.series) {
    await chart.updateSeries(fresh.series, false);
  }
}

async function runExportWithOverlay(
  liveChart: ApexCharts,
  type: ChartExportFormat,
  overlayOptions: apex.ApexOptions,
  liveOptions: apex.ApexOptions,
  exportFileName: string,
  csvSeries: apex.ApexOptions["series"],
  reapplyLive?: ChartExportReapply,
): Promise<void> {
  try {
    if (type === "csv") {
      liveChart.exports.exportToCSV({
        series: csvSeries ?? liveOptions.series,
        columnDelimiter: ",",
        fileName: sanitizeExportFilename(exportFileName),
      });
    } else if (isPieOrDonutChart(overlayOptions)) {
      await exportFromLivePieChart(
        liveChart,
        overlayOptions,
        type,
        exportFileName,
      );
    } else {
      await exportFromDetachedChart(
        overlayOptions,
        type,
        exportFileName,
        csvSeries,
      );
    }
  } finally {
    if (reapplyLive) {
      await reapplyLive();
    } else {
      await reapplyApexChartOptions(liveChart, liveOptions);
    }
  }
}

/**
 * Ranked bar and pie: add export title and attribution to PNG/SVG downloads.
 * Pie uses the visible chart; ranked bar uses an off-screen clone.
 */
export function runRankedPieChartExport(
  chart: ApexCharts,
  type: ChartExportFormat,
  baseOptions: apex.ApexOptions,
  title: string,
  exportFileBase: string,
  reapplyLive?: ChartExportReapply,
): void {
  const safeName = sanitizeExportFilename(exportFileBase);
  const previous = chartExportQueue.get(chart) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() =>
      runExportWithOverlay(
        chart,
        type,
        mergeExportOverlayIntoOptions(baseOptions, title, safeName),
        baseOptions,
        safeName,
        baseOptions.series,
        reapplyLive,
      ),
    )
    .catch(logChartExportFailure);
  chartExportQueue.set(chart, next);
}

/** Stacked top-sectors: export title on chart; attribution via off-screen render. */
export function runStackedChartExport(
  chart: ApexCharts,
  type: ChartExportFormat,
  baseOptions: apex.ApexOptions,
  reapplyLive?: ChartExportReapply,
): void {
  const exportFileBase = stackedChartExportFileBase(baseOptions);
  const previous = chartExportQueue.get(chart) ?? Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(() =>
      runExportWithOverlay(
        chart,
        type,
        appendExportAttributionToOptions(baseOptions),
        baseOptions,
        exportFileBase,
        baseOptions.series,
        reapplyLive,
      ),
    )
    .catch(logChartExportFailure);
  chartExportQueue.set(chart, next);
}

function logChartExportFailure(err: unknown): void {
  const message = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error("[chart-export] export failed:", message, stack ?? "");
}

/** Ranked bar and pie widgets: shared title, filename, and chart-ready guard. */
export function exportSmindexRankedPieChart(
  chart: ApexCharts | undefined,
  options: apex.ApexOptions | undefined,
  type: string | null,
  sectorCode: string,
  sectorName: string,
  graphSlug: string,
  perspective: string,
  exportFileSuffix: string,
  reapplyLive: ChartExportReapply,
): void {
  if (!type || !["png", "svg", "csv"].includes(type)) {
    return;
  }
  if (!chart || !options) {
    return;
  }
  const titleName = buildSmartSectorExportTitle(
    sectorCode,
    sectorName,
    graphSlug,
    perspective,
  );
  const exportFileBase = buildSmartSectorExportFilename(
    sectorCode,
    graphSlug,
    perspective,
    exportFileSuffix,
  );
  runRankedPieChartExport(
    chart,
    type as ChartExportFormat,
    options,
    titleName,
    exportFileBase,
    reapplyLive,
  );
}
