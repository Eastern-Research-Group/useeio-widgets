import * as apex from "apexcharts";
import { Widget } from "..";
import { WebModel, Sector } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from '../smartSectorWebApi.ts/webApiSmartSector';
import {selectSectorName, smartSectorCalc, SumSmartSectorTotal , uniqueSortedMappingGroupNoDuplicatesList} from '../smartSectorCalc/smartSectorCalculations'
import {SmartSector, SumSmartSectorTotalParts } from '../smartSectorChart/smartSector'
import { calculate } from "./toggleGraphs";

export interface SmartSectorChartConfig {
    model: WebModel;
    endpoint:string;
    selector: string;
}


export class SmartSectorEEIO extends Widget {
    chart:ApexCharts;
    modelSmartSectorApi:WebModelSmartSector;
    uniqueSortedMappingGroupNoDuplicates:string[];

    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
        this.modelSmartSectorApi = modelOfSmartSector({
            endpoint: this._chartConfig.endpoint as string,
            model: this._chartConfig.model.id() as string,
            asJsonFiles: true
    })
    }

   async update() {}

   async init(graphName:string)
   {
    const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    let sectorContributionToImpact:SectorContributionToImpact[] = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("final/"+graphName);
    let nameWithNoSpace = graphName.replace(/\-/g," ");
    let options = await this.getGraphs(sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace);
    let option = await calculate(options,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        option,
    );

    this.chart.render();
   }

   async selectiveGraph(graphName:string,perspective:string)
   {
    let sectorContributionToImpact:SectorContributionToImpact[] = []
    
    if(perspective === 'final')
    {
        sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("final/"+graphName);
    }
    else if(perspective === 'direct')
    {
        sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("direct/"+graphName);

    }
    let nameWithNoSpace = graphName.replace(/\-/g," ");
    let options = await this.getGraphs(sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace);
    let option = await calculate(options,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace);
    
    this.chart.updateOptions(option);
    this.chart.resetSeries();
   }
    
    async getGraphs(sectorContributionToImpact:SectorContributionToImpact[], modelSmartSector:WebModelSmartSector,scc:string) : Promise<SumSmartSectorTotalParts[]>
    {
        let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = await this.calculateValues(sectorContributionToImpact,modelSmartSector,scc)

        let sortTopTen:SumSmartSectorTotalParts[] = sortSumSmartSectorTotalParts.slice(0,10);


        return sortTopTen
    }


    async calculateValues(sectorContributionToImpactGhg:SectorContributionToImpact[],modelSmartSector:WebModelSmartSector,scc:string):Promise<SumSmartSectorTotalParts[]> {
      const impactoutputs:ImpactOutput[] = await modelSmartSector.impactOutPut();
      const sectorMappingList:SectorMapping[] = await modelSmartSector.sectorMapping();
      const sectorsList:Sector[] = await this._chartConfig.model.sectors();
      

      let smartSectorListGroup: SmartSector[]  = []
    
      sectorContributionToImpactGhg.forEach((t, i) => {
        let sumSectorCode = t.sector_code;
        let sumSectorName =   selectSectorName(t.sector_code,sectorsList);
        let sumImpactTotal = 0
        let sumPurchasedGroup = ''

        if(t?.purchased_commodity_code === undefined)
        {
            sumImpactTotal = t.total_impact;
            sumPurchasedGroup =  modelSmartSector.findPurchasedGroup(t.emissions_source,sectorMappingList);
        }
        else
        {
            if(scc.includes('Social'))
            sumImpactTotal = (((t.impact_per_purchase)*(modelSmartSector.findSectorOutput(t.sector_code,impactoutputs)))/1000000);
            else 
            sumImpactTotal =  (((t.impact_per_purchase)*(modelSmartSector.findSectorOutput(t.sector_code,impactoutputs)))/1000000000);
    
            sumPurchasedGroup = modelSmartSector.findPurchasedGroup(t.purchased_commodity_code,sectorMappingList);
        }
        

        smartSectorCalc(smartSectorListGroup,new SmartSector({
          sumSectorCode:sumSectorCode,
          sumSectorName:sumSectorName,
          sumtotalImpact:sumImpactTotal,
          sumPurchasedGroup:sumPurchasedGroup
        }))
      });

      let sumSmartSectorTotalParts: SumSmartSectorTotalParts[] = SumSmartSectorTotal(sectorsList,smartSectorListGroup,this.uniqueSortedMappingGroupNoDuplicates);

      

      let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = sumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
          return b._totalSectorCodeSummationImpact - a._totalSectorCodeSummationImpact;
      });

      return sortSumSmartSectorTotalParts;
    }

  }