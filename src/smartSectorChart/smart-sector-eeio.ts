import * as apex from "apexcharts";
import { Config, Widget } from "..";
import { WebModel, Sector, WebApiConfig } from "useeio";
import {modelOfSmartSector, WebModelSmartSector} from './webApiSmartSector';
import {selectSectorName, smartSectorCalc} from '../smartSectorCalc/smartSectorCalculations'
import {SmartSector} from '../smartSectorChart/smartSector'


export interface SmartSectorChartConfig {
    model: WebModel;
    selector: string;
}


export class SmartSectorEEIO extends Widget {

    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
    }

    

    async update(config: Config) {
       const modelSmartSector = this.modelSmartSector({
                endpoint: './api',
                model: 'SMART_SECTORv1.0',
                asJsonFiles: true,
        
        })

        const impactoutputs = await modelSmartSector.impactOutPut();
        const sectorContributionToImpactGhg = await modelSmartSector.sectorContributionToImpactGhg();
        const sectorMapping = await modelSmartSector.sectorMapping();
        const sectorsList = await this._chartConfig.model.sectors();

        const smartSectorListGroup: SmartSector[]  = []
        sectorContributionToImpactGhg.forEach((t, i) => {
              const sumSectorCode = t.sector_code;
              const sumSectorName =   selectSectorName(t.sector_code,sectorsList);
              const sumImpactTotal =  (((t.impact_per_purchase)*(modelSmartSector.findSectorOutput(t.sector_code,impactoutputs)))/1000000000);
              const sumPurchasedGroup =  modelSmartSector.findPurchasedGroup(t.purchased_commodity_code,sectorMapping);

              smartSectorCalc(smartSectorListGroup,new SmartSector({
                sumSectorCode:sumSectorCode,
                sumSectorName:sumSectorName,
                sumtotalImpact:sumImpactTotal,
                sumPurchasedGroup:sumPurchasedGroup
            }))


        })



        const options = await this.calculate(config);
        const chart = new ApexCharts(
            document.querySelector(this._chartConfig.selector),
            options,
        );
        chart.render();
    }


     modelSmartSector(conf: WebApiConfig & {model: string}): WebModelSmartSector {
        return modelOfSmartSector(conf);
    }

    private async calculate(config: Config): Promise<apex.ApexOptions> {       
    
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
