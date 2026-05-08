import * as apex from "apexcharts";
import { SECTOR_NAME_TOKEN } from "./sectorDashboardNarrative";

const YEARS = ["2017", "2018", "2019", "2020", "2021", "2022", "2023"] as const;

/** Deterministic hash so each sector code gets a stable but distinct curve. */
function hashSectorCode(code: string): number {
  let h = 0;
  for (let i = 0; i < code.length; i++) {
    h = Math.imul(31, h) + code.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Gross-output path for the dashboard's industry-output line chart, 2017–2023.
 *
 * Magnitudes are sized in the ballpark of industry gross output expressed in
 * millions of current dollars. Until a real time series is wired in, the
 * caller surfaces a "proxy data" notice next to the chart.
 */
export function buildIndustryOutputSeriesMillionsUSD(
  sectorCode: string,
): number[] {
  const h = hashSectorCode(sectorCode);
  // 2023 anchor: roughly $3B–$90B expressed in millions
  const y2023 = 3_000 + (h % 87_000);
  const y2017 = Math.round(y2023 * (0.72 + (h % 400) / 2_000)); // 72–92% of 2023
  const steps = 6;
  const out: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // smooth convex curve toward 2023
    const v = y2017 + (y2023 - y2017) * Math.pow(t, 1.05 + (h % 200) / 1_000);
    out.push(Math.round(v));
  }
  // 2020 dip (index 3): below neighbors, then recovery by 2021
  const dip = 0.93 - (h % 150) / 5_000;
  out[3] = Math.round(Math.min(out[3], out[2] * dip, out[4] * dip));
  if (out[4] <= out[3]) {
    out[4] = Math.round(out[3] * 1.04);
  }
  if (out[5] <= out[4]) {
    out[5] = Math.round(out[4] * 1.03);
  }
  if (out[6] <= out[5]) {
    out[6] = y2023;
  }
  return out;
}

export function getIndustryOutputChartOptions(
  _sectorName: string,
  sectorCode: string,
): apex.ApexOptions {
  const data = buildIndustryOutputSeriesMillionsUSD(sectorCode);
  return {
    chart: {
      type: "line",
      height: 240,
      toolbar: { show: false },
      zoom: { enabled: false },
      animations: { enabled: true },
    },
    series: [
      {
        name: "Gross output (millions $)",
        data,
      },
    ],
    xaxis: {
      categories: [...YEARS],
      title: { text: "Calendar year" },
    },
    yaxis: {
      title: {
        text: "Millions of current dollars",
      },
      labels: {
        formatter(val: string | number) {
          const n = typeof val === "number" ? val : parseFloat(val);
          if (!isFinite(n)) {
            return "";
          }
          return n.toLocaleString();
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
          dataPointIndex: 6,
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
          x: YEARS[6],
          borderColor: "#c62828",
          strokeDashArray: 0,
          label: {
            text: "2023 — focal year for this dashboard",
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
          return `${val.toLocaleString()} million $`;
        },
      },
    },
    legend: { show: false },
  };
}

/**
 * One-line caption shown under the chart (screen + print). The active sector
 * name is emitted as `SECTOR_NAME_TOKEN`; renderers wrap it in bold+italic.
 */
export function buildIndustryOutputCaption(
  series: readonly number[],
): string {
  const first = series[0];
  const last = series[series.length - 1];
  if (!isFinite(first) || !isFinite(last) || first <= 0) {
    return "";
  }
  const change = ((last - first) / first) * 100;
  const dir = change >= 0 ? "up" : "down";
  const amt = Math.abs(Math.round(change * 10) / 10);
  return (
    `Nominal gross output for ${SECTOR_NAME_TOKEN} trends ${dir} by about ${amt}% from 2017 to 2023; ` +
    `the red marker highlights 2023, the year aligned with the latest economic vintage used alongside the impact charts below.`
  );
}
