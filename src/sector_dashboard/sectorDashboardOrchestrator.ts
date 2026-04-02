import { WebModel } from "useeio";
import { modelOfSmartSector } from "../smartSectorWebApi.ts/webApiSmartSector";
import { SmartSectorEEIOImpactPurchasePerSector } from "../sector_contribution_to_impact_ranked_bar_chart.ts/smart-sector-eeio-impact-per-purchase";
import { SmartSectorEEIOTotalImpactPerSector } from "../sector_contribution_to_impact_ranked_bar_chart.ts/smart-sector-eeio-total-impacts";
import { PiePercentContributionDirectAndIndirect } from "../totalGhgEmissionPieChart.ts/piePercentContributionDirectAndIndirect";
import { PiePercentContribution } from "../totalGhgEmissionPieChart.ts/piePercentContribution";

/**
 * Owns ranked-bar and pie widget instances for each curated indicator; keeps them
 * in sync with shared sector / perspective / mode state.
 */
export class SectorDashboardOrchestrator {
  private readonly barIntensity: SmartSectorEEIOImpactPurchasePerSector[] = [];
  private readonly barTotal: SmartSectorEEIOTotalImpactPerSector[] = [];
  private readonly pieAgg: PiePercentContributionDirectAndIndirect[] = [];
  private readonly pieDetail: PiePercentContribution[] = [];

  constructor(
    private readonly model: WebModel,
    private readonly endpoint: "./api",
    private readonly indicators: readonly string[],
  ) {}

  async initCharts(sectorName: string, sectorCode: string): Promise<void> {
    const api = modelOfSmartSector({
      endpoint: this.endpoint as string,
      model: this.model.id() as string,
      asJsonFiles: true,
    });
    await api.init();

    for (let i = 0; i < this.indicators.length; i++) {
      const slug = this.indicators[i];
      const bi = new SmartSectorEEIOImpactPurchasePerSector({
        model: this.model,
        endpoint: this.endpoint,
        selector: `#sector-dash-bar-intensity-${i}`,
      });
      const bt = new SmartSectorEEIOTotalImpactPerSector({
        model: this.model,
        endpoint: this.endpoint,
        selector: `#sector-dash-bar-total-${i}`,
      });
      const pa = new PiePercentContributionDirectAndIndirect({
        model: this.model,
        endpoint: this.endpoint,
        selector: `#sector-dash-pie-agg-${i}`,
      });
      const pd = new PiePercentContribution({
        model: this.model,
        endpoint: this.endpoint,
        selector: `#sector-dash-pie-detail-${i}`,
      });
      this.barIntensity.push(bi);
      this.barTotal.push(bt);
      this.pieAgg.push(pa);
      this.pieDetail.push(pd);
      await bi.init(slug, sectorName, sectorCode);
      await bt.init(slug, sectorName, sectorCode);
      await pa.init(slug, sectorName);
      await pd.init(slug, sectorName);
    }
  }

  async setPerspective(
    perspective: string,
    sectorName: string,
  ): Promise<void> {
    for (let i = 0; i < this.indicators.length; i++) {
      const slug = this.indicators[i];
      await this.barIntensity[i].changePerspectiveGraph(
        perspective,
        slug,
        sectorName,
      );
      await this.barTotal[i].changePerspectiveGraph(
        perspective,
        slug,
        sectorName,
      );
      await this.pieAgg[i].changePerspectiveGraph(perspective, slug, sectorName);
      await this.pieDetail[i].changePerspectiveGraph(
        perspective,
        slug,
        sectorName,
      );
    }
  }

  async setSector(sectorName: string, sectorCode: string): Promise<void> {
    for (let i = 0; i < this.indicators.length; i++) {
      await this.barIntensity[i].updateGraph(sectorName, sectorCode);
      await this.barTotal[i].updateGraph(sectorName, sectorCode);
      await this.pieAgg[i].updateGraph(sectorName, sectorCode);
      await this.pieDetail[i].updateGraph(sectorName, sectorCode);
    }
  }

  refreshBarMode(
    mode: "impact_per_purchase" | "total_impact",
    sectorName: string,
    perspective: string,
  ): void {
    for (let i = 0; i < this.indicators.length; i++) {
      const slug = this.indicators[i];
      if (mode === "impact_per_purchase") {
        void this.barIntensity[i].changeGraph(slug, sectorName, perspective);
      } else {
        void this.barTotal[i].changeGraph(slug, sectorName, perspective);
      }
    }
  }

  refreshPieMode(mode: "aggregate" | "detail", sectorName: string): void {
    for (let i = 0; i < this.indicators.length; i++) {
      const slug = this.indicators[i];
      if (mode === "aggregate") {
        void this.pieAgg[i].changeGraph(slug, sectorName);
      } else {
        void this.pieDetail[i].changeGraph(slug, sectorName);
      }
    }
  }
}
