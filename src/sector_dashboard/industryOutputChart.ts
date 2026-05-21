import * as apex from "apexcharts";
import { normalizeSectorCodeBase } from "../util/util";
import { SECTOR_NAME_TOKEN } from "./sectorDashboardNarrative";

/** First calendar year shown on the dashboard line chart. */
export const INDUSTRY_OUTPUT_CHART_YEAR_START = 2000;

/** Apex chart height (px); host container should match. */
export const INDUSTRY_OUTPUT_CHART_HEIGHT = 360;

/** Max width of the chart host (px). */
export const INDUSTRY_OUTPUT_CHART_MAX_WIDTH = 1120;

/** Default focal year aligned with smart_sectors useeio target vintage. */
export const INDUSTRY_OUTPUT_FOCAL_YEAR = "2023";

export interface CommodityOutputTimeSeriesRow {
  sector_code: string;
  focal_year: string;
  years: string[];
  output_million_usd: number[];
}

export interface IndustryOutputSeries {
  years: string[];
  values: number[];
  focalYear: string;
  priceAdjusted: true;
}

function sectorLookupKeys(sectorId: string, sectorCode: string): string[] {
  const base = normalizeSectorCodeBase(sectorCode);
  const keys = new Set<string>([
    sectorId,
    sectorCode,
    base,
    `${base}/US`,
  ]);
  return Array.from(keys);
}

export function findCommodityOutputTimeSeries(
  catalog: CommodityOutputTimeSeriesRow[] | null | undefined,
  sectorId: string,
  sectorCode: string,
): CommodityOutputTimeSeriesRow | undefined {
  if (!catalog?.length) {
    return undefined;
  }
  const keys = sectorLookupKeys(sectorId, sectorCode);
  return catalog.find((row) => keys.includes(row.sector_code));
}

/**
 * Price-adjusted gross output (BEA MultiYearCommodityOutput × model Rho), millions USD.
 */
export function buildIndustryOutputSeriesFromCatalog(
  catalog: CommodityOutputTimeSeriesRow[] | null | undefined,
  sectorId: string,
  sectorCode: string,
  yearStart = INDUSTRY_OUTPUT_CHART_YEAR_START,
  yearEnd = Number(INDUSTRY_OUTPUT_FOCAL_YEAR),
): IndustryOutputSeries | null {
  const row = findCommodityOutputTimeSeries(catalog, sectorId, sectorCode);
  if (!row?.years?.length) {
    return null;
  }

  const years: string[] = [];
  const values: number[] = [];
  for (let i = 0; i < row.years.length; i++) {
    const y = row.years[i];
    const yr = Number(y);
    if (!isFinite(yr) || yr < yearStart || yr > yearEnd) {
      continue;
    }
    const v = row.output_million_usd[i];
    if (v == null || !isFinite(v)) {
      continue;
    }
    years.push(y);
    values.push(Math.round(v));
  }

  if (!years.length) {
    return null;
  }

  const pairs = years
    .map((year, idx) => ({ year, value: values[idx] }))
    .sort((a, b) => Number(a.year) - Number(b.year));

  return {
    years: pairs.map((p) => p.year),
    values: pairs.map((p) => p.value),
    focalYear: row.focal_year || INDUSTRY_OUTPUT_FOCAL_YEAR,
    priceAdjusted: true,
  };
}

const Y_AXIS_TICK_COUNT = 5;

/** Round up to a readable bound (1, 2, or 5 × 10^n). */
function niceAxisCeil(value: number): number {
  if (!isFinite(value) || value <= 0) {
    return 1;
  }
  const exponent = Math.floor(Math.log10(value));
  const magnitude = Math.pow(10, exponent);
  const fraction = value / magnitude;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

function industryOutputYAxisBounds(values: number[]): {
  min: number;
  max: number;
  tickAmount: number;
} {
  const dataMax = values.length ? Math.max(...values, 0) : 0;
  return {
    min: 0,
    max: niceAxisCeil(dataMax * 1.02),
    tickAmount: Y_AXIS_TICK_COUNT,
  };
}

export function formatIndustryOutputYearRange(
  series: IndustryOutputSeries | null,
): string {
  if (!series?.years.length) {
    return `${INDUSTRY_OUTPUT_CHART_YEAR_START}–${INDUSTRY_OUTPUT_FOCAL_YEAR}`;
  }
  const first = series.years[0];
  const last = series.years[series.years.length - 1];
  return first === last ? first : `${first}–${last}`;
}

export function getIndustryOutputChartOptions(
  _sectorName: string,
  series: IndustryOutputSeries | null,
): apex.ApexOptions {
  if (!series) {
    return {
      chart: { type: "line", height: INDUSTRY_OUTPUT_CHART_HEIGHT },
      series: [],
      noData: {
        text: "Output time series not available for this sector",
        align: "center",
        verticalAlign: "middle",
      },
    };
  }

  const focalIndex = series.years.indexOf(series.focalYear);
  const markerIndex = focalIndex >= 0 ? focalIndex : series.years.length - 1;
  const yAxis = industryOutputYAxisBounds(series.values);

  return {
    chart: {
      type: "line",
      height: INDUSTRY_OUTPUT_CHART_HEIGHT,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true },
    },
    series: [
      {
        name: "Gross output (millions $, price-adjusted)",
        data: series.values,
      },
    ],
    xaxis: {
      categories: [...series.years],
      title: { text: "Calendar year" },
    },
    yaxis: {
      min: yAxis.min,
      max: yAxis.max,
      tickAmount: yAxis.tickAmount,
      decimalsInFloat: 0,
      title: {
        text: "Millions of dollars (price-adjusted)",
      },
      labels: {
        formatter(val: string | number) {
          const n = typeof val === "number" ? val : parseFloat(val);
          if (!isFinite(n)) {
            return "";
          }
          return Math.round(n).toLocaleString();
        },
      },
    },
    stroke: { width: 3, curve: "smooth" },
    colors: ["#1565c0"],
    markers: {
      size: 4,
      hover: { sizeOffset: 2 },
      discrete: [
        {
          seriesIndex: 0,
          dataPointIndex: markerIndex,
          fillColor: "#c62828",
          strokeColor: "#ffffff",
          size: 9,
        },
      ],
    },
    dataLabels: { enabled: false },
    title: {
      text: "Industry output",
      align: "center",
    },
    annotations: {
      xaxis: [
        {
          x: series.years[markerIndex],
          borderColor: "#c62828",
          strokeDashArray: 0,
          label: {
            text: `${series.focalYear} — focal year for this dashboard`,
            borderColor: "#c62828",
            style: {
              color: "#fff",
              background: "#c62828",
            },
          },
        },
      ],
    },
    tooltip: {
      y: {
        formatter(val: number) {
          return `${Math.round(val).toLocaleString()} million $`;
        },
      },
    },
    legend: { show: false },
  };
}

/**
 * One-line caption shown under the chart (screen + print).
 */
export function buildIndustryOutputCaption(
  series: IndustryOutputSeries | null,
): string {
  if (!series?.values.length) {
    return "";
  }
  const startYear = String(INDUSTRY_OUTPUT_CHART_YEAR_START);
  const endYear = series.focalYear || INDUSTRY_OUTPUT_FOCAL_YEAR;
  const startIdx = series.years.indexOf(startYear);
  const endIdx = series.years.indexOf(endYear);
  if (startIdx < 0 || endIdx < 0) {
    return "";
  }
  const first = series.values[startIdx];
  const last = series.values[endIdx];
  if (!isFinite(first) || !isFinite(last) || first <= 0) {
    return "";
  }
  const change = ((last - first) / first) * 100;
  const dir = change >= 0 ? "up" : "down";
  const amt = Math.abs(Math.round(change * 10) / 10);
  return (
    `Price-adjusted nominal gross output for ${SECTOR_NAME_TOKEN} trends ${dir} by about ${amt}% from ${startYear} to ${endYear}; ` +
    `the red marker highlights ${endYear}, the year aligned with the latest economic vintage used alongside the impact charts below.`
  );
}
