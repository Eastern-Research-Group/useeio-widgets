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
      if (titleGraph == "Social Cost of Carbon") {
        yaxisTitle = "Emissions Intensity (Million $ per Million $ of Output)";
        unitLabel = "Million $ per Million $ of Output";
      } else {
        yaxisTitle =
          "Emissions Intensity (Metric tons CO2e per Million $ of Output)";
        unitLabel = "tons CO2e per Million $ of Output";
      }
    } else {
      if (titleGraph == "Social Cost of Carbon") {
        yaxisTitle = "Total Impact (Billion dollars)";
        unitLabel = "Billion dollars";
      } else {
        yaxisTitle = "Emissions (MMT CO2e)";
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
                return "" + parseFloat(val).toFixed(1) + "";
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
            return "" + val.toFixed(3) + " " + unitLabel;
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
