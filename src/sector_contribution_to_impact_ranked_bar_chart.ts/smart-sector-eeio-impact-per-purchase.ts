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
import { apexGraph } from "./getGraph";
import { exportSmindexRankedPieChart } from "../util/chartExportOverlay";
import { SECTOR_PURCHASES_FILE_SLUG } from "../util/util";
import * as apex from "apexcharts";

export interface SmartSectorChartConfig {
  model: WebModel;
  endpoint: string;
  selector: string;
}

export class SmartSectorEEIOImpactPurchasePerSector extends Widget {
  chart: ApexCharts;
  modelSmartSectorApi: WebModelSmartSector;
  uniqueSortedMappingGroupNoDuplicates: string[];
  sectorContributionToImpact: SectorContributionToImpact[];
  getTopValuesFromSectors: SortedImpactPerPurchaseTopList[];
  sectorsList: Sector[];
  sectorsListlowerCase: string[];
  graphName: string = "";
  perspective: string = "";
  sectorMappingList: SectorMapping[];
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
    this.sectorMappingList = await this.modelSmartSectorApi.sectorMapping();
    this.uniqueSortedMappingGroupNoDuplicates =
      uniqueSortedMappingGroupNoDuplicatesList(this.sectorMappingList);
    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();
    this.sectorContributionToImpact =
      await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI(
        "final/" + graphName,
      );
    this.getTopValuesFromSectors =
      await this.getTopFifteenImpactPerPurchaseWithGroup(
        this.sectorContributionToImpact,
        this.modelSmartSectorApi,
        "final",
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
    const sectorMappingList: SectorMapping[] =
      await this.modelSmartSectorApi.sectorMapping();
    this.uniqueSortedMappingGroupNoDuplicates =
      uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    const titleNameWithNoSpace = graphName.replace(/-+/g, " ").trim();
    this.sectorContributionToImpact = [];
    this.getTopValuesFromSectors = [];
    this.sectorContributionToImpact =
      await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI(
        this.perspective + "/" + graphName,
      );
    this.getTopValuesFromSectors =
      await this.getTopFifteenImpactPerPurchaseWithGroup(
        this.sectorContributionToImpact,
        this.modelSmartSectorApi,
        perspective,
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
    this.options = await apexGraph(
      this.getTopValuesFromSectors,
      sectorName,
      this.graphName.replace(/\-/g, " "),
    );
    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
  }

  getGraph(): string {
    return this.graphName;
  }

  async getTopFifteenImpactPerPurchaseWithGroup(
    sectorContributionToImpactGhg: SectorContributionToImpact[],
    modelSmartSector: WebModelSmartSector,
    perspective: string,
  ): Promise<SortedImpactPerPurchaseTopList[]> {
    this.perspective = perspective;
    const sectorsList: Sector[] = await this._chartConfig.model.sectors();
    const sortListWithTop15OfEachSector: SortingImpactPerPurchaseWithTop[] = [];
    const skipSmallIntensityCutoff =
      this.graphName === SECTOR_PURCHASES_FILE_SLUG;

    sectorContributionToImpactGhg.forEach((t, i) => {
      const ipp = Number(t.impact_per_purchase ?? 0);
      const isDirectRow =
        (perspective === "final" &&
          t.purchased_commodity_code === "Direct") ||
        (perspective !== "final" && t.emissions_source === "Direct");
      if (!isDirectRow && !skipSmallIntensityCutoff && ipp <= 0.001) {
        return;
      }
      if (perspective == "final") {
          const purchasedGroup = this.sectorMappingList.find((d) => {
            if (t.purchased_commodity_code == d.id) {
              return true;
            }
          })?.group_detail;

          const sectorName = selectSectorName(t.sector_code, sectorsList);
          let purchaseCommodity;
          if (isDirectRow) {
            purchaseCommodity = "Direct";
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
                impactPerPurchase: t.impact_per_purchase,
                domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                importedImpactPerPurchase: t.imported_impact_per_purchase,
                purchasedGroup: purchasedGroup,
              });

            sortListWithTop15OfEachSector.push(
              sortingImpactPerPurchaseWithTop15,
            );
          } else {
            const sortingImpactPerPurchaseWithTop15:
              | SortingImpactPerPurchaseWithTop
              | undefined = sortListWithTop15OfEachSector.find((i) => {
              if (t.sector_code === i._sectorCode) {
                return true;
              }
            });

            if (sortingImpactPerPurchaseWithTop15 !== undefined) {
              sortingImpactPerPurchaseWithTop15.addSmartSectorsByCommodityGroup(
                {
                  sectorCode: t.sector_code,
                  purchaseCommodity: purchaseCommodity,
                  impactPerPurchase: t.impact_per_purchase,
                  domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                  importedImpactPerPurchase: t.imported_impact_per_purchase,
                  purchasedGroup: purchasedGroup,
                },
              );
            } else {
              const sortingImpactPerPurchaseWithTop15 =
                new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
                  sectorCode: t.sector_code,
                  purchaseCommodity: purchaseCommodity,
                  impactPerPurchase: t.impact_per_purchase,
                  domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                  importedImpactPerPurchase: t.imported_impact_per_purchase,
                  purchasedGroup: purchasedGroup,
                });

              sortListWithTop15OfEachSector.push(
                sortingImpactPerPurchaseWithTop15,
              );
            }
          }
      } else {
          const purchasedGroup = this.sectorMappingList.find((d) => {
            if (t.emissions_source == d.id) {
              return true;
            }
          })?.group_detail;

          const sectorName = selectSectorName(t.sector_code, sectorsList);
          let purchaseCommodity;
          if (isDirectRow) {
            purchaseCommodity = "Direct";
          } else if (
            purchasedGroup == "All Others" ||
            purchasedGroup == undefined
          ) {
            purchaseCommodity = "All Others";
          } else
            purchaseCommodity = selectSectorName(
              t.emissions_source,
              sectorsList,
            );

          if (sortListWithTop15OfEachSector.length === 0) {
            const sortingImpactPerPurchaseWithTop15 =
              new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
                sectorCode: t.sector_code,
                purchaseCommodity: purchaseCommodity,
                impactPerPurchase: t.impact_per_purchase,
                domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                importedImpactPerPurchase: t.imported_impact_per_purchase,
                purchasedGroup: purchasedGroup,
              });

            sortListWithTop15OfEachSector.push(
              sortingImpactPerPurchaseWithTop15,
            );
          } else {
            const sortingImpactPerPurchaseWithTop15:
              | SortingImpactPerPurchaseWithTop
              | undefined = sortListWithTop15OfEachSector.find((i) => {
              if (t.sector_code === i._sectorCode) {
                return true;
              }
            });

            if (sortingImpactPerPurchaseWithTop15 !== undefined) {
              sortingImpactPerPurchaseWithTop15.addSmartSectorsByCommodityGroup(
                {
                  sectorCode: t.sector_code,
                  purchaseCommodity: purchaseCommodity,
                  impactPerPurchase: t.impact_per_purchase,
                  domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                  importedImpactPerPurchase: t.imported_impact_per_purchase,
                  purchasedGroup: purchasedGroup,
                },
              );
            } else {
              const sortingImpactPerPurchaseWithTop15 =
                new SortingImpactPerPurchaseWithTop(t.sector_code, sectorName, {
                  sectorCode: t.sector_code,
                  purchaseCommodity: purchaseCommodity,
                  impactPerPurchase: t.impact_per_purchase,
                  domesticImpactPerPurchase: t.domestic_impact_per_purchase,
                  importedImpactPerPurchase: t.imported_impact_per_purchase,
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
        const directBars = t._smartSectors.filter(
          (s) => s.purchaseCommodity === "Direct",
        );
        const nonDirect = t._smartSectors.filter(
          (s) => s.purchaseCommodity !== "Direct",
        );
        nonDirect.sort(
          (a: ImpactPerPurchaseSector, b: ImpactPerPurchaseSector): number =>
            (Number(b.impactPerPurchase) || 0) -
            (Number(a.impactPerPurchase) || 0),
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

        const directIndex = topFifteen.findIndex(
          (t) => t.purchaseCommodity === "Direct",
        );
        if (directIndex >= 0) {
          const [directItem] = topFifteen.splice(directIndex, 1);
          topFifteen.unshift(directItem);
        }

        return {
          sector_code: t._sectorCode,
          sector_name: t._sectorName,
          topFifteenImpactPerPurchase: topFifteen,
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
      this.graphName,
      this.perspective,
      "Impact-Intensity",
      () => this.reapplyChartAfterExport(),
    );
  }
}
