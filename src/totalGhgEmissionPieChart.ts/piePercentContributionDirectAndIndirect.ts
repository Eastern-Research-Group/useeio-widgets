import { Widget } from "..";
import { WebModel, Sector } from "useeio";
import {
  modelOfSmartSector,
  WebModelSmartSector,
  SectorMapping,
  PercentContribution,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import {
  selectSectorName,
  uniqueSortedMappingGroupNoDuplicatesList,
} from "../smartSectorCalc/smartSectorCalculations";
import {
  SortingPercentContribution,
  SortingPercentContributionIndirectAndDirect,
  ContributionListForSectorDirectOrIndirect,
} from "../smartSectorChart/smartSector";
import { apexGraph } from "./getGraphDirectorIndirect";
import * as apex from "apexcharts";

export interface SmartSectorChartConfig {
  model: WebModel;
  endpoint: string;
  selector: string;
}

export class PiePercentContributionDirectAndIndirect extends Widget {
  chart: ApexCharts;
  modelSmartSectorApi: WebModelSmartSector;
  uniqueSortedMappingGroupNoDuplicates: string[];
  percentContributionList: PercentContribution[];
  contributionList: SortingPercentContributionIndirectAndDirect[];
  sectorsList: Sector[];
  sectorsListlowerCase: string[];
  graphName: string = "";
  perspective: string;
  sectorCode: string = "1111A0";
  options: apex.ApexOptions;
  sector_name: string;

  constructor(private _chartConfig: SmartSectorChartConfig) {
    super();
    this.modelSmartSectorApi = modelOfSmartSector({
      endpoint: this._chartConfig.endpoint as string,
      model: this._chartConfig.model.id() as string,
      asJsonFiles: true,
    });
  }

  async update() {}

  async init(graphName?: string, sectorName?: string) {
    this.graphName = graphName;
    this.perspective = "final";
    this.sectorsList = await this._chartConfig.model.sectors();
    this.sector_name = sectorName;
    const sectorMappingList: SectorMapping[] =
      await this.modelSmartSectorApi.sectorMapping();
    this.uniqueSortedMappingGroupNoDuplicates =
      uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();
    this.percentContributionList =
      await this.modelSmartSectorApi.percentContribution("final/" + graphName);
    this.contributionList = await this.contributionListPerSector(
      this.percentContributionList,
    );
    this.options = await apexGraph(
      this.contributionList,
      this.sector_name,
      titleNameWithNoSpace,
    );
    this.chart = new ApexCharts(
      document.querySelector(this._chartConfig.selector),
      this.options,
    );

    this.chart.render();
  }

  async changePerspectiveGraph(
    perspective: string,
    graphName?: string,
    sectorName?: string,
  ) {
    if (this.perspective !== perspective) {
      this.perspective = perspective;
      this.graphName = graphName;
      this.sector_name = sectorName;
      this.percentContributionList =
        await this.modelSmartSectorApi.percentContribution(
          this.perspective + "/" + graphName,
        );
      this.contributionList = await this.contributionListPerSector(
        this.percentContributionList,
      );
      this.changeGraph(graphName, sectorName);
    }
  }

  async changeGraph(graphName?: string, sectorName?: string) {
    if (this.graphName !== graphName) {
      this.graphName = graphName;
      this.percentContributionList =
        await this.modelSmartSectorApi.percentContribution(
          this.perspective + "/" + graphName,
        );
      this.contributionList = await this.contributionListPerSector(
        this.percentContributionList,
      );
    }

    if (
      this.uniqueSortedMappingGroupNoDuplicates === undefined ||
      this.uniqueSortedMappingGroupNoDuplicates === null
    ) {
      const sectorMappingList: SectorMapping[] =
        await this.modelSmartSectorApi.sectorMapping();
      this.uniqueSortedMappingGroupNoDuplicates =
        uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    }

    this.sectorsList = await this._chartConfig.model.sectors();
    this.sector_name = sectorName;

    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();

    this.options = await apexGraph(
      this.contributionList,
      this.sector_name,
      titleNameWithNoSpace,
    );

    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
  }

  async updateGraph(sectorName?: string, sectorCode?: string) {
    this.sectorCode = sectorCode;
    this.sector_name = sectorName;
    this.options = await apexGraph(
      this.contributionList,
      sectorName,
      this.graphName.replace(/-+/g, " ").trim(),
    );
    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
  }

  getGraph(): string {
    return this.graphName;
  }

  async contributionListPerSector(
    sectorContribution: PercentContribution[],
  ): Promise<SortingPercentContributionIndirectAndDirect[]> {
    const sectorsList: Sector[] = await this._chartConfig.model.sectors();
    const sortedPercentList: SortingPercentContributionIndirectAndDirect[] = [];

    sectorContribution.forEach((t) => {
      if (sortedPercentList.length === 0) {
        let directOrIndirect = "Indirect";
        if (t.sector_purchased_detail == "Direct") {
          directOrIndirect = "Direct";
        }

        const sortingContribution =
          new SortingPercentContributionIndirectAndDirect(
            t.sector,
            selectSectorName(t.sector, sectorsList),
            {
              directOrIndirect: directOrIndirect,
              contribution: t.contribution,
              totalImpactSum: t.total_impacts_sum,
            },
          );

        sortedPercentList.push(sortingContribution);
      } else {
        const contributionPercentageFound:
          | SortingPercentContributionIndirectAndDirect
          | undefined = sortedPercentList.find((i) => {
          if (t.sector === i._sectorCode) {
            return true;
          }
        });

        if (contributionPercentageFound !== undefined) {
          const indirect: ContributionListForSectorDirectOrIndirect =
            contributionPercentageFound._contributionList.find((j) => {
              if (j.directOrIndirect === "Indirect") {
                return true;
              }
            });

          const direct: ContributionListForSectorDirectOrIndirect =
            contributionPercentageFound._contributionList.find((j) => {
              if (j.directOrIndirect === "Direct") {
                return true;
              }
            });

          if (
            indirect !== undefined &&
            !(t.sector_purchased_detail == "Direct")
          ) {
            indirect.contribution += t.contribution;
            indirect.totalImpactSum += t.total_impacts_sum;
          } else if (
            direct === undefined &&
            t.sector_purchased_detail == "Direct"
          ) {
            contributionPercentageFound.addContributionSectorList({
              directOrIndirect: "Direct",
              contribution: t.contribution,
              totalImpactSum: t.total_impacts_sum,
            });
          } else {
            contributionPercentageFound.addContributionSectorList({
              directOrIndirect: "Indirect",
              contribution: t.contribution,
              totalImpactSum: t.total_impacts_sum,
            });
          }
        } else {
          let sign = "Indirect";
          if (t.sector_purchased_detail == "Direct") {
            sign = "Direct";
          }

          const sortingContribution =
            new SortingPercentContributionIndirectAndDirect(
              t.sector,
              selectSectorName(t.sector, sectorsList),
              {
                directOrIndirect: sign,
                contribution: t.contribution,
                totalImpactSum: t.total_impacts_sum,
              },
            );

          sortedPercentList.push(sortingContribution);
        }
      }
    });

    return sortedPercentList;
  }

  addExportEventListeners(type: string) {
    if (type !== null) {
      let titleName: string;
      if (this.perspective == "final") {
        titleName = `Sector: ${this.sectorCode}, ${this.graphName.replace(/\-/g, " ").replace(" AR6 ", "-")}, Point of Consumption`;
      } else {
        titleName = `Sector: ${this.sectorCode}, ${this.graphName.replace(/\-/g, " ").replace(" AR6 ", "-")}, Supply Chain`;
      }

      // Show the title before export
      this.chart.updateOptions({
        ...this.options,
        chart: {
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
                filename: `${titleName}-DirectVsIndirect`,
                columnDelimiter: ",",
                headerCategory: "Sector Purchased",
                headerValue: "Contribution",
              },
              svg: {
                filename: `${titleName}-DirectVsIndirect`,
              },
              png: {
                filename: `${titleName}-DirectVsIndirect`,
              },
            },
          },
        },
        title: {
          text: titleName, // Title visible before exporting
        },
      });

      // Delay to ensure title is updated before export
      setTimeout(() => {
        if (type === "png") {
          this.chart.exports.exportToPng();
        } else if (type === "svg") {
          this.chart.exports.exportToSVG();
        } else if (type === "csv") {
          this.chart.dataURI().then(() => {
            this.chart.exports.exportToCSV({
              series: this.options["series"],
              columnDelimiter: ",",
              fileName: `${titleName}-DirectVsIndirect`.replace(",", "-"),
            });
          });
        }

        // Hide the title after export
        this.chart.updateOptions({
          ...this.options,
          title: {
            text: "",
          },
          chart: {
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
            },
            export: {
              csv: {
                filename: "",
              },
              svg: {
                filename: "",
              },
              png: {
                filename: "",
              },
            },
          },
        });
      }, 2000);
    }
  }
}
