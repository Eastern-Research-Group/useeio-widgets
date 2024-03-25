import * as apex from "apexcharts";
import { Widget } from "..";
import { WebModel, Sector } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from './webApiSmartSector';
import {selectSectorName, smartSectorCalc, SumSmartSectorTotal } from '../smartSectorCalc/smartSectorCalculations'
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
    let sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    let sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
           return a.group.localeCompare(b.group);
       });
    let uniqueSortedMappingGroupNoDuplicates:string[] = this.uniqueSortedMappingGroup(sortedSectorMappingByGroup);


    let sectorContributionToImpact:SectorContributionToImpact[] = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("final/"+graphName);
    let nameWithNoSpace = graphName.replace(/\-/g," ");
    let options = await this.getGraphs(sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace);
    let option = await calculate(options,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        option,
    );

    this.chart.render();
   }

   async selectiveGraph(graphName:string,perspective:string)
   {
    let sectorContributionToImpact:SectorContributionToImpact[] = []
    let sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    let sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
           return a.group.localeCompare(b.group);
       });
    let uniqueSortedMappingGroupNoDuplicates:string[] = this.uniqueSortedMappingGroup(sortedSectorMappingByGroup);
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
    let option = await calculate(options,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace);
    
    this.chart.updateOptions(option);
    this.chart.resetSeries();
   }

    private uniqueSortedMappingGroup(sortedSectorMappingByGroup:SectorMapping[]) : string[]{
        let sortedMappingGroupList:string[] = sortedSectorMappingByGroup.map( t => 
            {
                return t.group;
            })
        return sortedMappingGroupList.filter((value, index) => sortedMappingGroupList.indexOf(value) === index)   
    }
    
    async getGraphs(sectorContributionToImpact:SectorContributionToImpact[], modelSmartSector:WebModelSmartSector,scc:string) : Promise<SumSmartSectorTotalParts[]>
    {
        let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = await this.calculateValues(sectorContributionToImpact,modelSmartSector,scc)

        let sortTopTen:SumSmartSectorTotalParts[] = sortSumSmartSectorTotalParts.slice(0,10);


        return sortTopTen
    }


    async calculateValues(sectorContributionToImpactGhg:SectorContributionToImpact[],modelSmartSector:WebModelSmartSector,scc:string):Promise<SumSmartSectorTotalParts[]> {
      let impactoutputs:ImpactOutput[] = await modelSmartSector.impactOutPut();
      let sectorMappingList:SectorMapping[] = await modelSmartSector.sectorMapping();
      let sectorsList:Sector[] = await this._chartConfig.model.sectors();

      let sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
          return a.group.localeCompare(b.group);
      });

      let uniqueSortedMappingGroupNoDuplicates:string[] = this.uniqueSortedMappingGroup(sortedSectorMappingByGroup);
      

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

      let sumSmartSectorTotalParts: SumSmartSectorTotalParts[] = SumSmartSectorTotal(sectorsList,smartSectorListGroup,uniqueSortedMappingGroupNoDuplicates);

      

      let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = sumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
          return b._totalSectorCodeSummationImpact - a._totalSectorCodeSummationImpact;
      });

      return sortSumSmartSectorTotalParts;
    }

  }