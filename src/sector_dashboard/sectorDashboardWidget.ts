import * as ReactDOM from "react-dom";
import { WebModel } from "useeio";
import { Widget } from "../widget";
import React from "react";
import { filterPickableSectors } from "../util/util";
import { SectorDashboardApp } from "./sectorDashboardApp";

export type SectorDashboardConfig = {
  model: WebModel;
  endpoint: "./api";
  /** Root element selector for the React tree (e.g. `.sector-dashboard-root`) */
  selector: string;
  /**
   * Optional BEA/NAICS code from the page query string (`?sector=` or `?code=`).
   */
  initialSectorCode?: string;
  /** Optional initial perspective from the page query string (`?perspective=`). */
  initialPerspective?: "final" | "direct";
  /** Optional initial bar-chart mode (`?bar=intensity` or `?bar=total`). */
  initialBarMode?: "impact_per_purchase" | "total_impact";
  /** Optional initial pie-chart mode (`?pie=simple` or `?pie=detailed`). */
  initialPieMode?: "aggregate" | "detail";
  /** Optional indicator codes from `?ind=ACID,GCC,...`. */
  initialInd?: string;
};

/**
 * Multi-indicator sector dashboard: one sector, user-selected indicators,
 * global bar/pie/perspective toggles. Compose ranked-bar and pie widgets.
 */
export class SectorDashboard extends Widget {
  private readonly _config: SectorDashboardConfig;

  constructor(config: SectorDashboardConfig) {
    super();
    this._config = config;
  }

  async update() {
    const sectors = filterPickableSectors(
      await this._config.model.sectors(),
    );
    const root = document.querySelector(this._config.selector);
    if (!root) {
      console.error("SectorDashboard: missing root", this._config.selector);
      return;
    }
    ReactDOM.render(
      React.createElement(SectorDashboardApp, {
        model: this._config.model,
        endpoint: this._config.endpoint,
        sectors,
        initialSectorCode: this._config.initialSectorCode,
        initialPerspective: this._config.initialPerspective,
        initialBarMode: this._config.initialBarMode,
        initialPieMode: this._config.initialPieMode,
        initialInd: this._config.initialInd,
      }),
      root,
    );
  }
}

export function sectorDashboard(config: SectorDashboardConfig): SectorDashboard {
  return new SectorDashboard(config);
}
