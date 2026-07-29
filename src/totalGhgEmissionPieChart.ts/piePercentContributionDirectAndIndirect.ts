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
import {
  exportSmindexRankedPieChart,
  preparePieChartOptionsForDisplay,
} from "../util/chartExportOverlay";
import {
  displayContributionLabel,
  isDirectContributionLabel,
} from "../util/util";
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
  sectorCode: string = "";
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

  async init(graphName?: string, sectorName?: string, sectorCode?: string) {
    this.graphName = graphName;
    this.perspective = "final";
    this.sectorsList = await this._chartConfig.model.sectors();
    this.sector_name = sectorName;
    if (sectorCode) {
      this.sectorCode = sectorCode;
    } else {
      this.syncSectorCodeFromName(sectorName);
    }
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
      this.syncSectorCodeFromName(sectorName);
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
    this.syncSectorCodeFromName(sectorName);

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

  private syncSectorCodeFromName(sectorName?: string): void {
    if (!sectorName || !this.sectorsList?.length) {
      return;
    }
    const match = this.sectorsList.find((s) => s.name === sectorName);
    if (match?.code) {
      this.sectorCode = match.code;
    }
  }

  async contributionListPerSector(
    sectorContribution: PercentContribution[],
  ): Promise<SortingPercentContributionIndirectAndDirect[]> {
    const sectorsList: Sector[] = await this._chartConfig.model.sectors();
    const sortedPercentList: SortingPercentContributionIndirectAndDirect[] = [];

    sectorContribution.forEach((t) => {
      const directLabel = displayContributionLabel("Direct", this.graphName);
      if (sortedPercentList.length === 0) {
        let directOrIndirect = "Indirect";
        if (t.sector_purchased_detail == "Direct") {
          directOrIndirect = directLabel;
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
              if (isDirectContributionLabel(j.directOrIndirect)) {
                return true;
              }
            });

          if (t.sector_purchased_detail == "Direct") {
            if (direct !== undefined) {
              direct.contribution += t.contribution;
              direct.totalImpactSum += t.total_impacts_sum;
            } else {
              contributionPercentageFound.addContributionSectorList({
                directOrIndirect: directLabel,
                contribution: t.contribution,
                totalImpactSum: t.total_impacts_sum,
              });
            }
          } else if (indirect !== undefined) {
            indirect.contribution += t.contribution;
            indirect.totalImpactSum += t.total_impacts_sum;
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
            sign = directLabel;
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

  private async reapplyChartAfterExport(): Promise<void> {
    this.options = await apexGraph(
      this.contributionList,
      this.sector_name,
      this.graphName.replace(/-+/g, " ").trim(),
    );
    await this.chart.updateOptions(
      preparePieChartOptionsForDisplay(this.options),
      true,
      true,
    );
    this.chart.resetSeries();
  }

  addExportEventListeners(type: string) {
    exportSmindexRankedPieChart(
      this.chart,
      this.options,
      type,
      this.sectorCode,
      this.graphName,
      this.perspective,
      "DirectVsIndirect",
      () => this.reapplyChartAfterExport(),
    );
  }
}
