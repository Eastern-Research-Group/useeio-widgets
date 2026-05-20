import * as apex from "apexcharts";
import {
  ImpactPerPurchaseSector,
  SortedImpactPerPurchaseTopList,
} from "../smartSectorChart/smartSector";
import { formatNumberGraph } from "../util";
import { chartTypography } from "../util/chartTypography";

function hasPurchaseOriginIntensitySplit(
  graphTitleName: string | undefined,
  rows: ImpactPerPurchaseSector[],
): boolean {
  return (
    graphTitleName === "sector purchases" &&
    rows.length > 0 &&
    rows.every(
      (r) =>
        r.domesticImpactPerPurchase != null &&
        r.importedImpactPerPurchase != null &&
        !Number.isNaN(r.domesticImpactPerPurchase) &&
        !Number.isNaN(r.importedImpactPerPurchase),
    )
  );
}

//Impact Intensity graph
export async function apexGraph(
  sortingImpactPerPurchaseWithTopList: SortedImpactPerPurchaseTopList[],
  sectorName: string,
  graphTitleName?: string,
): Promise<apex.ApexOptions> {
  const values = sortingImpactPerPurchaseWithTopList.find((t) => {
    if (t.sector_name === sectorName) {
      return true;
    }
  });

  let unitLabel: string = "";

  const data: {
    purchase_commodity: string;
    impactPerPurchase: number;
    domesticImpactPerPurchase?: number;
    importedImpactPerPurchase?: number;
  }[] = values?.topFifteenImpactPerPurchase.map((t) => {
    return {
      purchase_commodity: t.purchaseCommodity,
      impactPerPurchase: t.impactPerPurchase,
      domesticImpactPerPurchase: t.domesticImpactPerPurchase,
      importedImpactPerPurchase: t.importedImpactPerPurchase,
    };
  });

  const stackOrigin = hasPurchaseOriginIntensitySplit(
    graphTitleName,
    values?.topFifteenImpactPerPurchase ?? [],
  );

  let list = data?.map((impact) => impact?.impactPerPurchase);
  let highestNumber: number = Math.max(...list);
  let highNumberFormat = formatNumberGraph(highestNumber);

  const sectorGraphTitle = values.sector_code + " - " + values.sector_name;
  const sortedSectorCodesWithNamesWithArray: string[][] = data.map((t) => {
    return t.purchase_commodity.split(" ");
  });
  let yaxisTitle = "";
  unitLabel = "";
  // note this switch duplicates that in toggleGraphs.ts
  switch (graphTitleName) {
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
      yaxisTitle = "Kilograms of PM 2.5 eq. Emissions per Million $ of Output";
      unitLabel = "kg PM2.5 eq. per Million $ of Output";
      break;
    case "Ozone Depletion":
      yaxisTitle = "Grams of CFC eq. Emissions per Million $ of Output";
      unitLabel = "g CFC eq. per Million $ of Output";
      break;
    case "Smog Formation Potential":
      yaxisTitle = "Metric Tons of O3 eq. Emissions per Million $ of Output";
      unitLabel = "tons O3 eq. per Million $ of Output";
      break;
    case "Freshwater withdrawals":
      yaxisTitle = "Cubic meters of Freshwater Used per Million $ of Output";
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
    case "sector purchases":
      yaxisTitle = "Million USD of Purchases per Million $ of Output";
      unitLabel = "million USD per Million $ of Output";
      break;
    case "Global Warming Potential":
    case "GWP AR6 100":
    case "GWP AR6 20":
      yaxisTitle = "Metric Tons of CO2 eq. Emissions per Million $ of Output";
      unitLabel = "tons CO2e per Million $ of Output";
      break;
    default:
      yaxisTitle = "Kilograms of Emissions per Million $ of Output";
      unitLabel = "kg per Million $ of Output";
      break;
  }

  const colors = stackOrigin
    ? ["#2E93fA", "#FF9800"]
    : data.map((t) => {
        return t.purchase_commodity.includes("Direct") ? "#4CAF50" : "#2E93fA";
      });

  let totalSum: number = 0;
  values.topFifteenImpactPerPurchase.forEach((t) => {
    totalSum += t.impactPerPurchase;
  });

  const series = stackOrigin
    ? [
        {
          name: "Domestic",
          data: data.map((t) => t.domesticImpactPerPurchase ?? 0),
        },
        {
          name: "Imported",
          data: data.map((t) => t.importedImpactPerPurchase ?? 0),
        },
      ]
    : [
        {
          name: "Impact Intensity",
          data: data.map((t) => t.impactPerPurchase),
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
      max: parseFloat(highNumberFormat),
      forceNiceScale: true,
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
              return (
                "" +
                parseFloat(formatNumberGraph(val)).toLocaleString() +
                " " +
                unitLabel
              );
            },
          },
        },
  };
}
