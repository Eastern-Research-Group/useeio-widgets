import * as apex from "apexcharts";
import {
  ContributionListForSector,
  SortingPercentContribution,
} from "../smartSectorChart/smartSector";
import { formatNumber, formatNumberGraph } from "../util";

export async function apexGraph(
  contributionList: SortingPercentContribution[],
  sector_name: string,
  graphName?: string,
): Promise<apex.ApexOptions> {
  const values = contributionList.find((t) => {
    if (t._sectorName === sector_name) {
      return true;
    }
  });

  const totalImpactsList: number[] = [];
  const sectorPurchasedList: string[] = [];
  const contrubutionList: number[] = [];
  const contrubutionColorList: string[] = [];

  if (values === undefined) {
    const options: apex.ApexOptions = {
      series: [],
      chart: {
        width: 800,
        type: "pie",
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
      annotations: {
        texts: [
          {
            text: "",
          },
        ],
      },
    };

    return options;
  } else {
    let totalSum: number = 0;
    values._contributionList.map((t) => {
      sectorPurchasedList.push(t.sectorPurchased);
      contrubutionList.push(t.contribution);
      totalImpactsList.push(t.totalImpactsSum);
      totalSum += t.totalImpactsSum;
      if (t.sectorPurchased.match("Agriculture")) {
        contrubutionColorList.push("#8D5B4C");
      } else if (t.sectorPurchased.match("Construction")) {
        contrubutionColorList.push("#2E93fA");
      } else if (t.sectorPurchased.match("Fuels")) {
        contrubutionColorList.push("#546E7A");
      } else if (t.sectorPurchased.match("Manufacturing")) {
        contrubutionColorList.push("#E91E63");
      } else if (t.sectorPurchased.match("Minerals")) {
        contrubutionColorList.push("#FF9800");
      } else if (t.sectorPurchased.match("Other")) {
        contrubutionColorList.push("#9b19f5");
      } else if (t.sectorPurchased.match("Purchased Electricity")) {
        contrubutionColorList.push("#2e2b28");
      } else if (t.sectorPurchased.match("Transport")) {
        contrubutionColorList.push("#ab3da9");
      } else if (t.sectorPurchased.match("Utilities")) {
        contrubutionColorList.push("#A5978B");
      } else {
        contrubutionColorList.push("#4CAF50");
      }
    });
    let pointSelection: number = 0;

    //All groups
    let unitLabel = "MT";
    switch (graphName) {
      case "Social Cost of Carbon":
        unitLabel = "Billion dollars";
        break;
      case "Acidification Potential":
        unitLabel = "Thousand MT SO2 eq.";
        break;
      case "Eutrophication Potential":
        unitLabel = "Thousand MT N eq.";
        break;
      case "Human Health Respiratory Effects":
        unitLabel = "Thousand MT PM2.5 eq.";
        break;
      case "Ozone Depletion":
        unitLabel = "MT CFC eq.";
        break;
      case "Smog Formation Potential":
        unitLabel = "Thousand MT O3 eq.";
        break;
      case "Freshwater withdrawals":
        unitLabel = "million m3";
        break;
      case "Commercial RCRA Hazardous Waste":
        unitLabel = "Thousand MT";
        break;
      case "Jobs Supported":
        unitLabel = "Jobs";
        break;
      case "sector purchases":
        unitLabel = "million USD";
        break;
      case "Global Warming Potential":
        unitLabel = "MMT CO2e";
        break;
    }

    let totalValue;
    switch (graphName) {
      case "Jobs Supported":
        totalValue = `${totalSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unitLabel} (100%)`;
        break;
      default:
        totalValue = `${formatNumberGraph(totalSum)} ${unitLabel} (100%)`;
        break;
    }

    return {
      series: contrubutionList,
      colors: contrubutionColorList,
      chart: {
        width: 600,
        height: 471.8,
        type: "donut",
        events: {
          dataPointMouseEnter: function () {
            const textElements = document.querySelectorAll(
              "#profile-chart-details svg text",
            );
            textElements[textElements.length - 1].setAttribute(
              "visibility",
              "hidden",
            );
          },
          dataPointSelection: function (event, chartContext, config) {
            pointSelection = config.selectedDataPoints[0].length;
            if (pointSelection > 0) {
              var textElements = document.querySelectorAll(
                "#profile-chart-details svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "hidden",
              );
            } else {
              var textElements = document.querySelectorAll(
                "#profile-chart-details svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "visible",
              );
            }
          },
          dataPointMouseLeave: function () {
            if (!(pointSelection > 0)) {
              const textElements = document.querySelectorAll(
                "#profile-chart-details svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "visible",
              );
            }
          },
        },
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
      plotOptions: {
        pie: {
          donut: {
            size: "80%",
            labels: {
              show: true,
              value: {
                show: true,
                formatter: function (val) {
                  const uniqueValue: ContributionListForSector =
                    values._contributionList.find((t) => {
                      if (t.contribution.toString() == val) return true;
                    });

                  let value;
                  switch (graphName) {
                    case "Jobs Supported":
                      value = `${uniqueValue.totalImpactsSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                      break;
                    default:
                      value = `${formatNumberGraph(uniqueValue.totalImpactsSum)} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                      break;
                  }
                  return value;
                },
                fontSize: "13px",
              },
            },
          },
        },
      },
      labels: sectorPurchasedList,
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 600,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
      tooltip: {
        enabled: true,
        y: {
          formatter: function (val) {
            const uniqueValue: ContributionListForSector =
              values._contributionList.find((t) => {
                if (t.contribution == val) return true;
              });

            let value;
            switch (graphName) {
              case "Jobs Supported":
                value = `${uniqueValue.totalImpactsSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                break;
              default:
                value = `${formatNumberGraph(uniqueValue.totalImpactsSum)} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                break;
            }
            return value;
          },
        },
      },
      annotations: {
        texts: [
          {
            text: totalValue,
            x: 220,
            y: 220,
            textAnchor: "middle",
            foreColor: "#333",
            fontSize: "13px",
            fontWeight: "bold",
          },
        ],
      },
    };
  }
}
