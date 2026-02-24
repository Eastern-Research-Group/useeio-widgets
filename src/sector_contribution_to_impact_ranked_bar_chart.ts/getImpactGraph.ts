import * as apex from "apexcharts";
import { SortedImpactPerPurchaseTopList } from "../smartSectorChart/smartSector";
import { formatNumberGraph } from "../util";

//Total Impacts graph
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

  data = values?.topFifteenTotalImpact.map((t) => {
    return {
      purchase_commodity: t.purchaseCommodity,
      totalImpact: t.totalImpact,
    };
  });

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
      unitLabel = " Billion dollars";
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
    case "Global Warming Potential":
      yaxisTitle = "Million Metric Tons of CO2 eq. Emissions";
      unitLabel = "MMT CO2e";
      break;
    default:
      yaxisTitle = "Metric Tons of Emissions";
      unitLabel = "MT";
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
        name: "Impact",
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
          y: highNumberFormat,
          borderColor: "white",
          label: {
            text: `Total: ${parseFloat(formatNumberGraph(totalSum)).toLocaleString()} ${unitLabel} for sector ${sectorName}`,
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
      forceNiceScale: true,
      max: parseFloat(highNumberFormat),
      min: 0,
      labels: {
        formatter: function (val) {
          return parseFloat(formatNumberGraph(val)).toLocaleString();
        },
      },
    },
    fill: {
      opacity: 1,
    },
    tooltip: {
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
