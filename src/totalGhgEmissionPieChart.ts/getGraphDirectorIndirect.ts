import * as apex from "apexcharts";
import {
  SortingPercentContribution,
  SortingPercentContributionIndirectAndDirect,
  ContributionListForSector,
  ContributionListForSectorDirectOrIndirect,
} from "../smartSectorChart/smartSector";
import { wrap } from "module";
import { formatNumberGraph } from "../util";

export async function apexGraph(
  contributionList: SortingPercentContributionIndirectAndDirect[],
  sector_name: string,
  graphName?: string,
): Promise<apex.ApexOptions> {
  const values = contributionList.find((t) => {
    if (t._sectorName === sector_name) {
      return true;
    }
  });

  const sectorPurchasedList: string[] = [];
  const contrubutionList: number[] = [];
  const contrubutionColorList: string[] = [];

  if (values === undefined) {
    return {
      series: [],
      chart: {
        width: 500,
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
          breakpoint: 400,
          options: {
            chart: {
              width: 300,
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
  } else {
    let totalSum: number = 0;
    values._contributionList.map((t) => {
      sectorPurchasedList.push(t.directOrIndirect);
      contrubutionList.push(t.contribution);
      totalSum += t.totalImpactSum;

      if (t.directOrIndirect.match("Direct")) {
        contrubutionColorList.push("#4CAF50");
      } else {
        contrubutionColorList.push("#2E93fA");
      }
    });
    let pointSelection: number = 0;

    //Direct and Indirect only
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
      case "Global Warming Potential":
      case "GWP AR6 100":
      case "GWP AR6 20":
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
              "#profile-chart svg text",
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
                "#profile-chart svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "hidden",
              );
            } else {
              var textElements = document.querySelectorAll(
                "#profile-chart svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "visible",
              );
            }
          },
          dataPointMouseLeave: function () {
            if (pointSelection > 0) {
              var textElements = document.querySelectorAll(
                "#profile-chart svg text",
              );
              textElements[textElements.length - 1].setAttribute(
                "visibility",
                "hidden",
              );
            } else {
              var textElements = document.querySelectorAll(
                "#profile-chart svg text",
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
                  const uniqueValue: ContributionListForSectorDirectOrIndirect =
                    values._contributionList.find((t) => {
                      if (t.contribution.toString() == val) return true;
                    });

                  let value;
                  switch (graphName) {
                    case "Jobs Supported":
                      value = `${uniqueValue.totalImpactSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                      break;
                    default:
                      value = `${formatNumberGraph(uniqueValue.totalImpactSum)} ${unitLabel} (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                      break;
                  }
                  return value;
                },
                fontSize: "15px",
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
            const uniqueValue: ContributionListForSectorDirectOrIndirect =
              values._contributionList.find((t) => {
                if (t.contribution == val) return true;
              });

            let value;
            switch (graphName) {
              case "Jobs Supported":
                value = `${uniqueValue.totalImpactSum.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${unitLabel}  (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
                break;
              default:
                value = `${formatNumberGraph(uniqueValue.totalImpactSum)} ${unitLabel} (${(uniqueValue.contribution * 100).toFixed(2)}%)`;
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
            x: 250,
            y: 240,
            textAnchor: "middle",
            foreColor: "#333",
            fontSize: "15px",
            fontWeight: "bold",
          },
        ],
      },
    };
  }
}
