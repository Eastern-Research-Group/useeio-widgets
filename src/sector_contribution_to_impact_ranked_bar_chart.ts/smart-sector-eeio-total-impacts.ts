import { Widget } from "..";
import { WebModel, Sector } from "useeio";
import {
  modelOfSmartSector,
  WebModelSmartSector,
  SectorMapping,
  SectorContributionToImpact,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import {
  selectSectorName,
  uniqueSortedMappingGroupNoDuplicatesList,
} from "../smartSectorCalc/smartSectorCalculations";
import {
  SortedImpactPerPurchaseTopList,
  SortingImpactPerPurchaseWithTop,
  ImpactPerPurchaseSector,
} from "../smartSectorChart/smartSector";
import { apexGraph } from "./getImpactGraph";
import { exportSmindexRankedPieChart } from "../util/chartExportOverlay";
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

export class SmartSectorEEIOTotalImpactPerSector extends Widget {
  chart: ApexCharts;
  modelSmartSectorApi: WebModelSmartSector;
  uniqueSortedMappingGroupNoDuplicates: string[];
  sectorContributionToImpact: SectorContributionToImpact[];
  getTopValuesFromSectors: SortedImpactPerPurchaseTopList[];
  sectorsList: Sector[];
  sectorsListlowerCase: string[];
  graphName: string = "";
  perspective: string;
  sector_name: string = "";
  sectorCode: string = "";
  options: apex.ApexOptions;

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
    this.sectorCode = sectorCode;
    this.perspective = "final";
    this.sectorsList = await this._chartConfig.model.sectors();
    const sector_name: string = sectorName ? sectorName : "";
    this.sector_name = sector_name;
    const sectorMappingList: SectorMapping[] =
      await this.modelSmartSectorApi.sectorMapping();
    this.uniqueSortedMappingGroupNoDuplicates =
      uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();
    this.sectorContributionToImpact =
      await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI(
        "final/" + graphName,
      );
    this.getTopValuesFromSectors = await this.getTopFifteenTotalImpactWithGroup(
      this.sectorContributionToImpact,
      this.modelSmartSectorApi,
    );

    this.options = await apexGraph(
      this.getTopValuesFromSectors,
      sector_name,
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
    if (this.perspective != perspective) {
      this.perspective = perspective;
    }

    this.changeGraph(graphName, sectorName, perspective);
  }

  async changeGraph(
    graphName?: string,
    sectorName?: string,
    perspective?: string,
  ) {
    this.perspective = perspective;
    this.graphName = graphName;
    this.sectorsList = await this._chartConfig.model.sectors();
    const sector_name: string = sectorName ? sectorName : "";
    this.sector_name = sector_name;
    const sectorMappingList: SectorMapping[] =
      await this.modelSmartSectorApi.sectorMapping();
    this.uniqueSortedMappingGroupNoDuplicates =
      uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();
    this.sectorContributionToImpact = [];
    this.getTopValuesFromSectors = [];
    this.sectorContributionToImpact =
      await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI(
        perspective + "/" + graphName,
      );
    this.getTopValuesFromSectors = await this.getTopFifteenTotalImpactWithGroup(
      this.sectorContributionToImpact,
      this.modelSmartSectorApi,
    );

    this.options = await apexGraph(
      this.getTopValuesFromSectors,
      sector_name,
      titleNameWithNoSpace,
    );
    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
  }

  async updateGraph(sectorName?: string, sectorCode?: string) {
    this.sectorCode = sectorCode;
    this.sector_name = sectorName ? sectorName : "";
    this.options = await apexGraph(
      this.getTopValuesFromSectors,
      sectorName,
      this.graphName.replace(/-+/g, " ").trim(),
    );
    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
  }

  getGraph(): string {
    return this.graphName;
  }

  async getTopFifteenTotalImpactWithGroup(
    sectorContributionToImpactGhg: SectorContributionToImpact[],
    modelSmartSector: WebModelSmartSector,
  ): Promise<SortedImpactPerPurchaseTopList[]> {
    const sectorMappingList: SectorMapping[] =
      await modelSmartSector.sectorMapping();
    const sectorsList: Sector[] = await this._chartConfig.model.sectors();
    const sortListWithTop15OfEachSector: SortingImpactPerPurchaseWithTop[] = [];

    sectorContributionToImpactGhg.forEach((t, i) => {
      //All records in (sector_contribution_to_impact_ranked/final) of "total_impact"
      if (this.perspective == "final") {
        const isDirectRow = t.purchased_commodity_code === "Direct";
        const purchasedGroup = modelSmartSector.findPurchasedGroup(
          t.purchased_commodity_code,
          sectorMappingList,
        );
        const sectorName = selectSectorName(t.sector_code, sectorsList);
        let purchaseCommodity;
        if (isDirectRow) {
          purchaseCommodity = displayContributionLabel("Direct", this.graphName);
        } else if (
          purchasedGroup == "All Others" ||
          purchasedGroup == undefined
        ) {
          purchaseCommodity = "All Others";
        } else
          purchaseCommodity = selectSectorName(
            t.purchased_commodity_code,
            sectorsList,
          );

        if (sortListWithTop15OfEachSector.length === 0) {
          const sortingImpactPerPurchaseWithTop15 =
            new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
              sectorCode: t.sector_code,
              purchaseCommodity: purchaseCommodity,
              totalImpact: t.total_impact,
              domesticPurchase: t.domestic_purchase,
              importedPurchase: t.imported_purchase,
              purchasedGroup: purchasedGroup,
            });

          sortListWithTop15OfEachSector.push(sortingImpactPerPurchaseWithTop15);
        } else {
          const sortingImpactPerPurchaseWithTop15:
            | SortingImpactPerPurchaseWithTop
            | undefined = sortListWithTop15OfEachSector.find((i) => {
            if (t.sector_code === i._sectorCode) {
              return true;
            }
          });

          if (sortingImpactPerPurchaseWithTop15 !== undefined) {
            sortingImpactPerPurchaseWithTop15.addSmartSectorsByCommodityGroup({
              sectorCode: t.sector_code,
              purchaseCommodity: purchaseCommodity,
              totalImpact: t.total_impact,
              domesticPurchase: t.domestic_purchase,
              importedPurchase: t.imported_purchase,
              purchasedGroup: purchasedGroup,
            });
          } else {
            const sortingImpactPerPurchaseWithTop15 =
              new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
                sectorCode: t.sector_code,
                purchaseCommodity: purchaseCommodity,
                totalImpact: t.total_impact,
                domesticPurchase: t.domestic_purchase,
                importedPurchase: t.imported_purchase,
                purchasedGroup: purchasedGroup,
              });

            sortListWithTop15OfEachSector.push(
              sortingImpactPerPurchaseWithTop15,
            );
          }
        }
      } else {
        const isDirectRow = t.emissions_source === "Direct";
        const purchasedGroup = modelSmartSector.findPurchasedGroup(
          t.emissions_source,
          sectorMappingList,
        );

        const sectorName = selectSectorName(t.sector_code, sectorsList);
        let purchaseCommodity;
        if (isDirectRow) {
          purchaseCommodity = displayContributionLabel("Direct", this.graphName);
        } else if (
          purchasedGroup == "All Others" ||
          purchasedGroup == undefined
        ) {
          purchaseCommodity = "All Others";
        } else
          purchaseCommodity = selectSectorName(t.emissions_source, sectorsList);

        if (sortListWithTop15OfEachSector.length === 0) {
          const sortingImpactPerPurchaseWithTop15 =
            new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
              sectorCode: t.sector_code,
              purchaseCommodity: purchaseCommodity,
              totalImpact: t.total_impact,
              domesticPurchase: t.domestic_purchase,
              importedPurchase: t.imported_purchase,
              purchasedGroup: purchasedGroup,
            });

          sortListWithTop15OfEachSector.push(sortingImpactPerPurchaseWithTop15);
        } else {
          const sortingImpactPerPurchaseWithTop15:
            | SortingImpactPerPurchaseWithTop
            | undefined = sortListWithTop15OfEachSector.find((i) => {
            if (t.sector_code === i._sectorCode) {
              return true;
            }
          });

          if (sortingImpactPerPurchaseWithTop15 !== undefined) {
            sortingImpactPerPurchaseWithTop15.addSmartSectorsByCommodityGroup({
              sectorCode: t.sector_code,
              purchaseCommodity: purchaseCommodity,
              totalImpact: t.total_impact,
              domesticPurchase: t.domestic_purchase,
              importedPurchase: t.imported_purchase,
              purchasedGroup: purchasedGroup,
            });
          } else {
            const sortingImpactPerPurchaseWithTop15 =
              new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
                sectorCode: t.sector_code,
                purchaseCommodity: purchaseCommodity,
                totalImpact: t.total_impact,
                domesticPurchase: t.domestic_purchase,
                importedPurchase: t.imported_purchase,
                purchasedGroup: purchasedGroup,
              });

            sortListWithTop15OfEachSector.push(
              sortingImpactPerPurchaseWithTop15,
            );
          }
        }
      }
    });

    const sortedImpactPerPurchaseTopList: SortedImpactPerPurchaseTopList[] =
      sortListWithTop15OfEachSector.map((t) => {
        const directBars = t._smartSectors.filter((s) =>
          isDirectContributionLabel(s.purchaseCommodity),
        );
        const nonDirect = t._smartSectors.filter(
          (s) => !isDirectContributionLabel(s.purchaseCommodity),
        );
        nonDirect.sort(
          (a: ImpactPerPurchaseSector, b: ImpactPerPurchaseSector): number =>
            (Number(b.totalImpact) || 0) - (Number(a.totalImpact) || 0),
        );
        const cap = Math.max(0, 15 - directBars.length);
        const topFifteen: ImpactPerPurchaseSector[] = [
          ...directBars,
          ...nonDirect.slice(0, cap),
        ];

        const allOtherIndex = topFifteen.findIndex(
          (t) => t.purchaseCommodity.toLowerCase() === "all others",
        );
        if (allOtherIndex >= 0) {
          const [allOthersItem] = topFifteen.splice(allOtherIndex, 1);
          topFifteen.push(allOthersItem);
        }

        const directIndex = topFifteen.findIndex((t) =>
          isDirectContributionLabel(t.purchaseCommodity),
        );
        if (directIndex >= 0) {
          const [directItem] = topFifteen.splice(directIndex, 1);
          topFifteen.unshift(directItem);
        }

        return {
          sector_code: t._sectorCode,
          sector_name: t._sectorName,
          topFifteenTotalImpact: topFifteen,
        };
      });

    return sortedImpactPerPurchaseTopList;
  }

  private async reapplyChartAfterExport(): Promise<void> {
    this.options = await apexGraph(
      this.getTopValuesFromSectors,
      this.sector_name,
      this.graphName.replace(/-+/g, " ").trim(),
    );
    await this.chart.updateOptions(this.options, false, true);
    if (this.options.series) {
      await this.chart.updateSeries(this.options.series, false);
    }
  }

  addExportEventListeners(type: string) {
    exportSmindexRankedPieChart(
      this.chart,
      this.options,
      type,
      this.sectorCode,
      this.sector_name,
      this.graphName,
      this.perspective,
      "Impacts",
      () => this.reapplyChartAfterExport(),
    );
  }
}
