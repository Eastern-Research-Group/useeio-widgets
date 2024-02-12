import * as apex from "apexcharts";
import { Config, Widget } from "../";
import { WebModel, Sector } from "useeio";

export interface SmartSectorChartConfig {
    model: WebModel;
    selector: string;
}

export class SmartSectorEEIO extends Widget {

    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
    }

    async update(config: Config) {
        const options = await this.calculate(config);
        const chart = new ApexCharts(
            document.querySelector(this._chartConfig.selector),
            options,
        );
        chart.render();
    }

    private async selectSectors(config: Config): Promise<Sector[]> {
        if (!config.sectors || config.sectors.length === 0) {
            return [];
        }


        const sectors = await this._chartConfig.model.sectors();
        return sectors.filter(s => {
            if (config.sectors.indexOf(s.code) < 0) {
                return false;
            }
            if (config.location && s.location !== config.location) {
                return false;
            }
            return true;
        });
    }

    private async calculate(config: Config): Promise<apex.ApexOptions> {
        const sectors = await this.selectSectors(config);
        console.log(sectors)
       
    
        return {
            chart: { type: "bar" },
            series: [{
                name: "profile",
                data: [],
            }],
            xaxis: {
                categories: [],
            },
        };
    }

}
