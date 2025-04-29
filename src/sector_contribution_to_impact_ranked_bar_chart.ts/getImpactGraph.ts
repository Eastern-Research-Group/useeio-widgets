import * as apex from "apexcharts";
import { SortedImpactPerPurchaseTopList } from "../smartSectorChart/smartSector";

export async function apexGraph(
  sortingImpactPerPurchaseWithTopList: SortedImpactPerPurchaseTopList[],
  sectorName: string,
  graphTitleName?: string,
): Promise<apex.ApexOptions> {
  let data: {
    purchase_commodity: string;
    totalImpact: number;
  }[];
  const values = sortingImpactPerPurchaseWithTopList.find((t) => {
    if (t.sector_name === sectorName) {
      return true;
    }
  });

  data = values.topFifteenTotalImpact.map((t) => {
    return {
      purchase_commodity: t.purchaseCommodity,
      totalImpact: t.totalImpact,
    };
  });

  const sortedSectorCodesWithNamesWithArray: string[][] = data.map((t) => {
    return t.purchase_commodity.split(" ");
  });

  let unitLabel: string = "";
  let yaxisTitle = "";
  // Note this switch duplicates that in toggleGraphs.ts
  switch(graphTitleName) {
    case "Social Cost of Carbon":
      yaxisTitle = "Total Impact (Billion dollars)";
      unitLabel = " Billion dollars";
      break;
    case "Acidification Potential":
      yaxisTitle = "Emissions (MMT SO2 eq.)";
      unitLabel = "MMT SO2 eq.";
      break;
    case "Eutrophication Potential":
      yaxisTitle = "Emissions (MMT N eq.)";
      unitLabel = "MMT N eq.";
      break;
    case "Human Health Respiratory Effects":
      yaxisTitle = "Emissions (MMT PM2.5 eq.)";
      unitLabel = "MMT PM2.5 eq.";
      break;
    case "Ozone Depletion":
      yaxisTitle = "Emissions (MT CFC eq.)";
      unitLabel = "MT CFC eq.";
      break;
    case "Smog Formation Potential":
      yaxisTitle = "Emissions (MMT O3 eq.)";
      unitLabel = "MMT O3 eq.";
      break;
    case "Freshwater withdrawals":
      yaxisTitle = "Resource Use (million m3)";
      unitLabel = "million m3";
      break;
    case "Jobs Supported":
      yaxisTitle = "Jobs";
      unitLabel = "Jobs";
      break;
    default:
      yaxisTitle = "Emissions (MMT CO2e)";
      unitLabel = " MMT CO2e";
      break;
  }

  const colors = data.map((t) => {
    return t.purchase_commodity.includes("Direct") ? "#4CAF50" : "#2E93fA";
  });

  let totalSum: number = 0;
  values.topFifteenTotalImpact.forEach((t) => {
    totalSum += t.totalImpact;
  });

  return {
    series: [
      {
        name: "Emissions",
        data: data.map((t) => t.totalImpact),
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
        },
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
          y: values.topFifteenTotalImpact[0].totalImpact,
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
        values.topFifteenTotalImpact[0].totalImpact +
        values.topFifteenTotalImpact[values.topFifteenTotalImpact.length -1].totalImpact,
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
