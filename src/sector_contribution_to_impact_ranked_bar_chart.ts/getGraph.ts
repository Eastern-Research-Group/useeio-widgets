import * as apex from "apexcharts";
import { SortedImpactPerPurchaseTopList } from "../smartSectorChart/smartSector";

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
  }[] = values.topFifteenImpactPerPurchase.map((t) => {
    return {
      purchase_commodity: t.purchaseCommodity,
      impactPerPurchase: t.impactPerPurchase,
    };
  });

  const sectorGraphTitle = values.sector_code + " - " + values.sector_name;
  const sortedSectorCodesWithNamesWithArray: string[][] = data.map((t) => {
    return t.purchase_commodity.split(" ");
  });
  let yaxisTitle = "";
  unitLabel = "";
  // note this switch duplicates that in toggleGraphs.ts
  switch (graphTitleName) {
    case "Social Cost of Carbon" :
      yaxisTitle = "Million $ per Million $ of Output";
      unitLabel = " Million $ per Million $ of Output";
      break;
    case "Acidification Potential":
      yaxisTitle = "Kilograms of SO2 eq. Emissions per Million $ of Output";
      unitLabel = "kg SO2 eq. per Million $ of Output";
      break;
    case "Eutrophication Potential":
      yaxisTitle = "Metric Tons of N eq. Release per Million $ of Output";
      unitLabel = "tons N eq. per Million $ of Output";
      break;
    case "Human Health Respiratory Effects":
      yaxisTitle = "Kilograms of PM 2.5 eq. Emissions per Million $ of Output";
      unitLabel = "kg PM2.5 eq. per Million $ of Output";
      break;
    case "Ozone Depletion":
      yaxisTitle = "Metric Tons of CFC eq. Emissions per Million $ of Output";
      unitLabel = "tons CFC eq. per Million $ of Output";
      break;
    case "Smog Formation Potential":
      yaxisTitle = "Metric Tons of O3 eq. Emissions per Million $ of Output";
      unitLabel = "tons O3 eq. per Million $ of Output";
      break;
    case "Freshwater withdrawals":
      yaxisTitle = "Cubic meters of Freshwater Used per Million $ of Output";
      unitLabel = "m3 per Million $ of Output";
      break;
    case "Jobs Supported":
      yaxisTitle = "Number of jobs per Million $ of Output";
      unitLabel = "jobs per Million $ of Output";
      break;
    default:
      yaxisTitle = "Metric Tons of CO2 eq. Emissions per Million $ of Output";
      unitLabel = "tons CO2e per Million $ of Output";
      break;
  }

  const colors = data.map((t) => {
    return t.purchase_commodity.includes("Direct") ? "#4CAF50" : "#2E93fA";
  });

  let totalSum: number = 0;
  values.topFifteenImpactPerPurchase.forEach((t) => {
    totalSum += t.impactPerPurchase;
  });

  return {
    series: [
      {
        name: "Impact Intensity",
        data: data.map((t) => t.impactPerPurchase),
      },
    ],
    chart: {
      height: 500,
      type: "bar",
      toolbar: {
        show: true,
        tools: {
          download: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false,
        }
      },
    },
    colors: colors,

    plotOptions: {
      bar: {
        columnWidth: "55%",
        distributed: true,
      },
    },
    annotations: {
      yaxis: [
        {
          y: values.topFifteenImpactPerPurchase[0].impactPerPurchase,
          borderColor: "white",
          label: {
            text: `${totalSum.toFixed(2)} Total ${unitLabel} for sector ${sectorName}`,
            style: {
              fontWeight: "bold",
            },
          },
        },
      ],
    },
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    xaxis: {
      categories: sortedSectorCodesWithNamesWithArray,
    },
    yaxis: {
      title: {
        text: yaxisTitle,
      },
      max:
        values.topFifteenImpactPerPurchase[0].impactPerPurchase +
        values.topFifteenImpactPerPurchase[values.topFifteenImpactPerPurchase.length -1].impactPerPurchase,
      forceNiceScale: true,
      labels: {
        formatter: function (val) {
          return (Math.round(val * 100) / 100).toFixed(2);
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
      y: {
        formatter: function (val) {
          return "" + val.toFixed(3) + " " + unitLabel;
        },
      },
    },
  };
}
