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

    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
    }

    async update() {
      let modelSmartSector = modelOfSmartSector({
               endpoint: this._chartConfig.endpoint as string,
               model: this._chartConfig.model.id() as string,
               asJsonFiles: true
       })

       let sectorContributionToImpactFinalGWP_AR6_20:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("final/GWP-AR6-20.json");
       let sectorContributionToImpactFinalGWP_AR6_100:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("final/GWP-AR6-100.json");
       let sectorContributionToImpactFinalSCC:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("final/Social-Cost-of-Carbon.json");
      
       let sectorContributionToImpactDirectGWP_AR6_20:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("direct/GWP-AR6-20.json");
       let sectorContributionToImpactDirectGWP_AR6_100:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("direct/GWP-AR6-100.json");
       let sectorContributionToImpactDirectSCC:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg("direct/Social-Cost-of-Carbon.json");


       let sectorMappingList:SectorMapping[] = await modelSmartSector.sectorMapping();  
       let sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
           return a.group.localeCompare(b.group);
       });
       let uniqueSortedMappingGroupNoDuplicates:string[] = this.uniqueSortedMappingGroup(sortedSectorMappingByGroup);


       let optionsFinalGWP_AR6_20 = await this.getGraphs(sectorContributionToImpactFinalGWP_AR6_20, modelSmartSector,'GWP-AR6-20');
       let optionsFinalGWP_AR6_100 = await this.getGraphs(sectorContributionToImpactFinalGWP_AR6_100, modelSmartSector,'GWP-AR6-100');
       let optionsFinalSCC = await this.getGraphs(sectorContributionToImpactFinalSCC, modelSmartSector,'Social Cost of Carbon');
       

       let optionsDirectGWP_AR6_20 = await this.getGraphs(sectorContributionToImpactDirectGWP_AR6_20, modelSmartSector,'GWP-AR6-20');
       let optionsDirectGWP_AR6_100 = await this.getGraphs(sectorContributionToImpactDirectGWP_AR6_100, modelSmartSector,'GWP-AR6-100');
       let optionsDirectSCC = await this.getGraphs(sectorContributionToImpactDirectSCC, modelSmartSector,'Social Cost of Carbon');

       let option20 = await calculate(optionsFinalGWP_AR6_20,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'GWP-AR6-20');
       let option100 = await calculate(optionsFinalGWP_AR6_100,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'GWP-AR6-100');
       let optionSCC = await calculate(optionsFinalSCC,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'Social Cost of Carbon');

       let option20Direct = await calculate(optionsDirectGWP_AR6_20,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'GWP-AR6-20');
       let option100Direct = await calculate(optionsDirectGWP_AR6_100,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'GWP-AR6-100');
       let optionSCCDirect = await calculate(optionsDirectSCC,this._chartConfig.model,uniqueSortedMappingGroupNoDuplicates,'Social Cost of Carbon');

       let chart20 = new ApexCharts(
           document.querySelector(this._chartConfig.selector),
           option20,
       );
      let chart100 = new ApexCharts(
            document.querySelector(this._chartConfig.selector+"-100"),
            option100,
        );

       let chartSCC = new ApexCharts(
            document.querySelector(this._chartConfig.selector+"-SCC"),
            optionSCC,
        );

       chart20.render();
       chart100.render(); 
       chartSCC.render();

       let chart20Direct = new ApexCharts(
        document.querySelector(this._chartConfig.selector+'_direct'),
        option20Direct,
    );
    let chart100Direct = new ApexCharts(
        document.querySelector(this._chartConfig.selector+"-100_direct"),
        option100Direct,
    );

    let chartSCCDirect = new ApexCharts(
        document.querySelector(this._chartConfig.selector+"-SCC_direct"),
        optionSCCDirect,
    );

        chart20Direct.render();
        chart100Direct.render(); 
        chartSCCDirect.render();
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