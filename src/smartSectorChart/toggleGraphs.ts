import * as apex from "apexcharts";
import {
  sortedSectorCodeList,
  sortedSeriesList,
} from "../smartSectorCalc/smartSectorCalculations";
import { SumSmartSectorTotalParts } from "../smartSectorChart/smartSector";
import { WebModel, Sector } from "useeio";

export async function calculate(
  topSectorList: SumSmartSectorTotalParts[],
  model: WebModel,
  uniqueSortedMapping: string[],
  titleGraph?: string,
  impactSelector?: string,
  groupMappingSector?: string,
  perspective?: string,
  titleFileName?:string
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
      switch(titleGraph) {
        case "Social Cost of Carbon":
          yaxisTitle = "Million $ per Million $ of Output)";
          unitLabel = "Million $ per Million $ of Output";
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
      }
    } else {
      switch(titleGraph) {
        case "Social Cost of Carbon":
          yaxisTitle = "Total Impact (Billion dollars)";
          unitLabel = "Billion dollars";
          break;
        case "Acidification Potential":
          yaxisTitle = "Million Metric Tons of SO2 eq. Emissions";
          unitLabel = "MMT SO2 eq.";
          break;
        case "Eutrophication Potential":
          yaxisTitle = "Million Metric Tons of N eq. Releases";
          unitLabel = "MMT N eq.";
          break;
        case "Human Health Respiratory Effects":
          yaxisTitle = "Million Metric Tons of PM2.5 eq. Emissions";
          unitLabel = "MMT PM2.5 eq.";
          break;
        case "Ozone Depletion":
          yaxisTitle = "Metric Tons of CFC eq. Emissions";
          unitLabel = "MT CFC eq.";
          break;
        case "Smog Formation Potential":
          yaxisTitle = "Million Metric Tons of O3 eq. Emissions";
          unitLabel = "MMT O3 eq.";
          break;
        case "Freshwater withdrawals":
          yaxisTitle = "Million Cubic Meters of Freshwater Used";
          unitLabel = "million m3";
          break;
        case "Jobs Supported":
          yaxisTitle = "Number of Jobs Supported";
          unitLabel = "Jobs";
          break;
        default:
          yaxisTitle = "Million Metric Tons of CO2 eq. Emissions";
          unitLabel = "MMT CO2e";
      }
    }

    let titleName: string;
    if (perspective == "final") {
      titleName = `${titleFileName}: ${titleGraph.replace(" AR6 ", "-")}, Point of Consumption`;
    } else {
      titleName = `${titleFileName}: ${titleGraph.replace(" AR6 ", "-")}, Supply Chain`;
    }

    const sortedSectorCodesWithNamesWithArray: string[][] =
      sortedSectorCodes.map((t) => {
        const sectorName: Sector = sectorsList.find((s) => {
          if (s.id === t) {
            return true;
          }
        });

        return [sectorName.name].concat(sectorName.id);
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
        height: 500,
        stacked: true,
        toolbar: {
          show: true,
          tools: {
            download: true,
            zoom: false,
            zoomin: false,
            zoomout: false,
            pan: false,
            reset: false,
          },
          export: {
            csv: {
              filename: titleName.replace(",", "-"),
            },
            svg: {
              filename: titleName.replace(",", "-"),
            },
            png: {
              filename: titleName.replace(",", "-"),
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
      },
      plotOptions: {
        bar: {
          horizontal: false,
          dataLabels: {
            total: {
              enabled: true,
              formatter: function (val) {
              let value
              switch (titleGraph) {
                case "Jobs Supported":
                  value = "" + Math.round(Number(val)).toLocaleString() + "";
                  break;
                default:
                  value =  "" + parseFloat(val).toFixed(1) + "";
                  break;
              }
                return value
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
          rotate: -45,
          rotateAlways: true,
          hideOverlappingLabels: false,
          trim: true,
          minHeight: -100,
        },
      },
      yaxis: [
        {
          title: {
            text: yaxisTitle,
          },
          forceNiceScale: true,
          min: 0,
          max: undefined,
          labels: {
            formatter: function (val) {
              return val.toFixed(1);
            },
          },
        },
      ],
      legend: {
        position: "bottom",
      },
      tooltip: {
        enabled: true,
        onDatasetHover: {
          highlightDataSeries: false,
        },
        y: {
          formatter: function (val) {
            let value
            switch (titleGraph) {
              case "Jobs Supported":
                value = "" + Math.round(val).toLocaleString() + " " + unitLabel
                break;
              default:
                value =  "" + val.toFixed(3) + " " + unitLabel;
                break;
            }
              return value
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
