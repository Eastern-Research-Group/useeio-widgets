import * as apex from "apexcharts";
import {
  sortedSectorCodeList,
  sortedSeriesList,
} from "../smartSectorCalc/smartSectorCalculations";
import { SumSmartSectorTotalParts } from "../smartSectorChart/smartSector";
import { WebModel, Sector } from "useeio";
import { formatNumberGraph } from "../util";
import { sanitizeExportFilename } from "../util/chartExportOverlay";
import { chartTypography, apexYAxisTitleConfig } from "../util/chartTypography";
import { getLabel } from "../util/indicatorCatalog";

const STACKED_AXIS_NAME_LINE_LENGTH = 24;
const STACKED_AXIS_MAX_NAME_LINES = 2;

function stripSectorSuffix(sectorId: string): string {
  return sectorId.replace(/\/US$/, "");
}

function wrapLabelLine(
  text: string,
  maxLineLength: number,
  maxLines: number,
): string[] {
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

export async function calculate(
  topSectorList: SumSmartSectorTotalParts[],
  model: WebModel,
  uniqueSortedMapping: string[],
  titleGraph?: string,
  /** Indicator file slug (e.g. Releases-to-Ground) for catalog display names in figure titles. */
  indicatorSlug?: string,
  impactSelector?: string,
  groupMappingSector?: string,
  perspective?: string,
  titleFileName?: string,
  /** Filter key from the stacked Sector Filter control (e.g. construction_materials). */
  sectorFilterName?: string,
): Promise<apex.ApexOptions> {
  const sortTopTen: SumSmartSectorTotalParts[] = topSectorList.sort(
    (a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
      return (
        b._totalSectorCodeSummationImpact - a._totalSectorCodeSummationImpact
      );
    },
  );

  if (sortTopTen.length > 0) {
    const sectorsList: Sector[] = await model.sectors();
    const sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
    const sortedSeries: { name: string; data: number[] }[] = sortedSeriesList(
      sortTopTen,
      uniqueSortedMapping,
      impactSelector,
    );
    let yaxisTitle = "";
    let unitLabel: string = "";
    if (impactSelector == "impact_per_purchase") {
      switch (titleGraph) {
        case "Social Cost of Carbon":
          yaxisTitle = "Million $ per Million $ of Output";
          unitLabel = "Million $ per Million $ of Output";
          break;
        case "Acidification Potential":
          yaxisTitle = "Kilograms of SO2 eq. Emissions per Million $ of Output";
          unitLabel = "kg SO2 eq. per Million $ of Output";
          break;
        case "Eutrophication Potential":
          yaxisTitle = "Kilograms of N eq. Release per Million $ of Output";
          unitLabel = "kg N eq. per Million $ of Output";
          break;
        case "Human Health Respiratory Effects":
          yaxisTitle =
            "Kilograms of PM 2.5 eq. Emissions per Million $ of Output";
          unitLabel = "kg PM2.5 eq. per Million $ of Output";
          break;
        case "Ozone Depletion":
          yaxisTitle = "Grams of CFC eq. Emissions per Million $ of Output";
          unitLabel = "g CFC eq. per Million $ of Output";
          break;
        case "Smog Formation Potential":
          yaxisTitle =
            "Metric Tons of O3 eq. Emissions per Million $ of Output";
          unitLabel = "tons O3 eq. per Million $ of Output";
          break;
        case "Freshwater withdrawals":
          yaxisTitle =
            "Cubic meters of Freshwater Used per Million $ of Output";
          unitLabel = "m3 per Million $ of Output";
          break;
        case "Commercial RCRA Hazardous Waste":
          yaxisTitle = "Kilograms of Waste Generated per Million $ of Output";
          unitLabel = "kg per Million $ of Output";
          break;
        case "Jobs Supported":
          yaxisTitle = "Number of jobs per Million $ of Output";
          unitLabel = "jobs per Million $ of Output";
          break;
        case "Releases to Ground":
          yaxisTitle = "Kilograms of Releases per Million $ of Output";
          unitLabel = "kg per Million $ of Output";
          break;
        case "Global Warming Potential":
        case "GWP AR6 100":
        case "GWP AR6 20":
          yaxisTitle =
            "Metric Tons of CO2 eq. Emissions per Million $ of Output";
          unitLabel = "tons CO2e per Million $ of Output";
          break;
        default:
          yaxisTitle = "Kilograms of Emissions per Million $ of Output";
          unitLabel = "kg per Million $ of Output";
      }
    } else {
      switch (titleGraph) {
        case "Social Cost of Carbon":
          yaxisTitle = "Total Impact (Billion dollars)";
          unitLabel = "Billion dollars";
          break;
        case "Acidification Potential":
          yaxisTitle = "Thousand Metric Tons of SO2 eq. Emissions";
          unitLabel = "Thousand MT SO2 eq.";
          break;
        case "Eutrophication Potential":
          yaxisTitle = "Thousand Metric Tons of N eq. Releases";
          unitLabel = "Thousand MT N eq.";
          break;
        case "Human Health Respiratory Effects":
          yaxisTitle = "Thousand Metric Tons of PM2.5 eq. Emissions";
          unitLabel = "Thousand MT PM2.5 eq.";
          break;
        case "Ozone Depletion":
          yaxisTitle = "Metric Tons of CFC eq. Emissions";
          unitLabel = "MT CFC eq.";
          break;
        case "Smog Formation Potential":
          yaxisTitle = "Thousand Metric Tons of O3 eq. Emissions";
          unitLabel = "Thousand MT O3 eq.";
          break;
        case "Freshwater withdrawals":
          yaxisTitle = "Million Cubic Meters of Freshwater Used";
          unitLabel = "million m3";
          break;
        case "Jobs Supported":
          yaxisTitle = "Number of Jobs Supported";
          unitLabel = "Jobs";
          break;
        case "Commercial RCRA Hazardous Waste":
          yaxisTitle = "Thousand Metric Tons of Waste Generated";
          unitLabel = "Thousand MT";
          break;
        case "Releases to Ground":
          yaxisTitle = "Metric Tons of Releases";
          unitLabel = "MT";
          break;
        case "Global Warming Potential":
        case "GWP AR6 100":
        case "GWP AR6 20":
          yaxisTitle = "Million Metric Tons of CO2 eq. Emissions";
          unitLabel = "MMT CO2e";
          break;
        default:
          yaxisTitle = "Metric Tons of Emissions";
          unitLabel = "MT";
      }
    }

    const indicatorTitle = indicatorSlug
      ? getLabel(indicatorSlug)
      : (titleGraph ?? "").replace(" AR6 ", "-");
    const perspectiveLabel =
      perspective == "final" ? "Point of Consumption" : "Supply Chain";
    // Curated filter presets + custom list: "<filter>: <indicator>"; Top 10/25 keep "from".
    const useFilterColonTitle =
      sectorFilterName === "construction_materials" ||
      sectorFilterName === "energy_intensive" ||
      sectorFilterName === "custom_sector_list";
    const titleName = useFilterColonTitle
      ? `${titleFileName}: ${indicatorTitle} (${perspectiveLabel})`
      : `${titleFileName} from ${indicatorTitle} (${perspectiveLabel})`;

    const sortedSectorCodesWithNamesWithArray: string[][] =
      sortedSectorCodes.map((t) => {
        const sectorName: Sector | undefined = sectorsList.find((s) => s.id === t);
        const wrappedName = wrapLabelLine(
          sectorName?.name ?? t,
          STACKED_AXIS_NAME_LINE_LENGTH,
          STACKED_AXIS_MAX_NAME_LINES,
        );
        return [...wrappedName, stripSectorSuffix(sectorName?.id ?? t)];
      });

    let colors: string[] = [];
    if (groupMappingSector === "group_summary") {
      colors = ["#4CAF50", "#2e2b28", "#ab3da9", "#9b19f5"];
    } else
      colors = [
        "#4CAF50",
        "#2e2b28",
        "#ab3da9",
        "#546E7A",
        "#E91E63",
        "#FF9800",
        "#2E93fA",
        "#8D5B4C",
        "#A5978B",
        "#9b19f5",
      ];

    return {
      series: sortedSeries,
      colors: colors,
      chart: {
        type: "bar",
        height: 540,
        stacked: true,
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
              filename: sanitizeExportFilename(titleName),
            },
            svg: {
              filename: sanitizeExportFilename(titleName),
            },
            png: {
              filename: sanitizeExportFilename(titleName),
            },
          },
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            legend: {
              position: "bottom",
              offsetX: -10,
              offsetY: 0,
            },
          },
        },
      ],
      title: {
        text: titleName,
        align: "center",
        style: {
          fontSize: chartTypography.chartTitle,
          fontWeight: 600,
        },
      },
      plotOptions: {
        bar: {
          horizontal: false,
          dataLabels: {
            total: {
              enabled: true,
              style: {
                fontSize: chartTypography.stackedBarTotal,
                fontWeight: 600,
              },
              formatter: function (val) {
                let value;
                value =
                  "" +
                  Number(formatNumberGraph(Number(val))).toLocaleString() +
                  "";
                return value;
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      xaxis: {
        type: "category",
        categories: sortedSectorCodesWithNamesWithArray,
        labels: {
          show: true,
          rotate: 0,
          rotateAlways: false,
          hideOverlappingLabels: false,
          trim: false,
          minHeight: 96,
          maxHeight: 120,
          style: {
            fontSize: chartTypography.axisLabel,
          },
        },
      },
      yaxis: [
        {
          title: apexYAxisTitleConfig(yaxisTitle),
          forceNiceScale: true,
          min: 0,
          max: undefined,
          labels: {
            style: {
              fontSize: chartTypography.axisLabel,
            },
            formatter: function (val) {
              return Number(formatNumberGraph(val)).toLocaleString();
            },
          },
        },
      ],
      legend: {
        position: "bottom",
        horizontalAlign: "center",
        offsetY: 8,
        fontSize: chartTypography.axisLabel,
        fontWeight: 500,
        itemMargin: {
          horizontal: 10,
          vertical: 4,
        },
      },
      grid: {
        padding: {
          left: 12,
          bottom: 24,
        },
      },
      tooltip: {
        enabled: true,
        onDatasetHover: {
          highlightDataSeries: false,
        },
        y: {
          formatter: function (val) {
            let value;
            value =
              "" +
              Number(formatNumberGraph(val)).toLocaleString() +
              " " +
              unitLabel;
            return value;
          },
        },
        x: {
          show: false,
        },
      },
      fill: {
        opacity: 1,
      },
    };
  } else {
    return {
      series: [{ name: "NA", data: [] }],
      chart: {
        type: "bar",
        height: 500,
        stacked: true,
        toolbar: {
          show: true,
        },
      },
      labels: [],
      noData: {
        text: "There's no data",
        align: "center",
        verticalAlign: "middle",
        offsetX: 0,
        offsetY: 0,
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 400,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };
  }
}
