import * as apex from "apexcharts";
import {
  ImpactPerPurchaseSector,
  SortedImpactPerPurchaseTopList,
} from "../smartSectorChart/smartSector";
import { formatNumberGraph } from "../util";
import { chartTypography } from "../util/chartTypography";

function hasPurchaseOriginSplit(
  graphTitleName: string | undefined,
  rows: ImpactPerPurchaseSector[],
): boolean {
  return (
    graphTitleName === "sector purchases" &&
    rows.length > 0 &&
    rows.every(
      (r) =>
        r.domesticPurchase != null &&
        r.importedPurchase != null &&
        !Number.isNaN(r.domesticPurchase) &&
        !Number.isNaN(r.importedPurchase),
    )
  );
}

//Total Impacts graph
export async function apexGraph(
  sortingImpactPerPurchaseWithTopList: SortedImpactPerPurchaseTopList[],
  sectorName: string,
  graphTitleName?: string,
): Promise<apex.ApexOptions> {
  let data: {
    purchase_commodity: string;
    totalImpact: number;
    domesticPurchase?: number;
    importedPurchase?: number;
  }[];
  const values = sortingImpactPerPurchaseWithTopList.find((t) => {
    if (t.sector_name === sectorName) {
      return true;
    }
  });

  data = values?.topFifteenTotalImpact.map((t) => {
    return {
      purchase_commodity: t.purchaseCommodity,
      totalImpact: t.totalImpact,
      domesticPurchase: t.domesticPurchase,
      importedPurchase: t.importedPurchase,
    };
  });

  const stackOrigin = hasPurchaseOriginSplit(
    graphTitleName,
    values?.topFifteenTotalImpact ?? [],
  );

  let list = data?.map((impact) => parseFloat(impact?.totalImpact.toString()));
  let highestNumber: number = Math.max(...list);
  let highNumberFormat = formatNumberGraph(highestNumber);
  const sortedSectorCodesWithNamesWithArray: string[][] = data.map((t) => {
    return t.purchase_commodity.split(" ");
  });

  let unitLabel: string = "";
  let yaxisTitle = "";
  // Note this switch duplicates that in toggleGraphs.ts
  switch (graphTitleName) {
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
    case "Commercial RCRA Hazardous Waste":
      yaxisTitle = "Thousand Metric Tons of Waste Generated";
      unitLabel = "Thousand MT";
      break;
    case "Jobs Supported":
      yaxisTitle = "Number of Jobs Supported";
      unitLabel = "Jobs";
      break;
    case "sector purchases":
      yaxisTitle = "Million USD of Purchases";
      unitLabel = "million USD";
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
      break;
  }

  const colors = stackOrigin
    ? ["#2E93fA", "#FF9800"]
    : data.map((t) => {
        return t.purchase_commodity.includes("Direct") ? "#4CAF50" : "#2E93fA";
      });

  let totalSum: number = 0;
  values.topFifteenTotalImpact.forEach((t) => {
    totalSum += t.totalImpact;
  });

  const series = stackOrigin
    ? [
        {
          name: "Domestic",
          data: data.map((t) => t.domesticPurchase ?? 0),
        },
        {
          name: "Imported",
          data: data.map((t) => t.importedPurchase ?? 0),
        },
      ]
    : [
        {
          name: "Impact",
          data: data.map((t) => t.totalImpact),
        },
      ];

  return {
    series,
    chart: {
      height: 500,
      type: "bar",
      stacked: stackOrigin,
      toolbar: {
        show: true,
        tools: {
          download: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        },
      },
    },
    colors: colors,
    plotOptions: {
      bar: {
        columnWidth: "55%",
        distributed: !stackOrigin,
      },
    },
    annotations: {
      yaxis: [
        {
          y: highNumberFormat,
          borderColor: "white",
          label: {
            text: `Total: ${parseFloat(formatNumberGraph(totalSum)).toLocaleString()} ${unitLabel} for sector ${sectorName}`,
            style: {
              fontWeight: "bold",
              fontSize: chartTypography.annotationLabel,
            },
          },
        },
      ],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: stackOrigin,
      position: "top",
    },
    xaxis: {
      categories: sortedSectorCodesWithNamesWithArray,
      labels: {
        style: {
          fontSize: chartTypography.axisLabel,
        },
      },
    },
    yaxis: {
      title: {
        text: yaxisTitle,
        style: {
          fontSize: chartTypography.axisTitle,
          fontWeight: 600,
        },
      },
      forceNiceScale: true,
      max: parseFloat(highNumberFormat),
      min: 0,
      labels: {
        style: {
          fontSize: chartTypography.axisLabel,
        },
        formatter: function (val) {
          return parseFloat(formatNumberGraph(val)).toLocaleString();
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: stackOrigin
      ? {
          shared: true,
          intersect: false,
          y: {
            formatter: function (val: number) {
              return (
                parseFloat(formatNumberGraph(val)).toLocaleString() +
                " " +
                unitLabel
              );
            },
          },
        }
      : {
          y: {
            formatter: function (val) {
              let value;
              value =
                "" +
                parseFloat(formatNumberGraph(val)).toLocaleString() +
                " " +
                unitLabel;
              return value;
            },
          },
        },
  };
}
