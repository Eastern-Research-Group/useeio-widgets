import * as apex from "apexcharts";
import { Widget } from "..";
import { WebModel, Sector } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from '../smartSectorWebApi.ts/webApiSmartSector';
import {selectSectorName, SumSmartSectorTotal , uniqueSortedMappingGroupNoDuplicatesList} from '../smartSectorCalc/smartSectorCalculations'
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
    toggleNumSelection:number;
    toggleImpactSelection:string;
    toggleGroupSelection:string;
    listSumSmartSectorTotalParts:SumSmartSectorTotalParts[];
    perspective:string;
    graphName:string;
    selectorName:string;
    sectorContributionToImpact:SectorContributionToImpact[] = []

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
    this.toggleNumSelection = 10;
    this.toggleGroupSelection = 'group_detail';
    this.toggleImpactSelection = 'total_impact';
    this.modelSmartSectorApi.init()
    this.graphName = graphName;
    this.perspective = 'final'
    this.selectorName = 'total_rank'
    const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList,this.toggleGroupSelection);
    this.sectorContributionToImpact= await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("final/"+graphName);
    let nameWithNoSpace = graphName.replace(/\-/g," ");
    let options = await this.getGraphs(this.sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace, this.toggleNumSelection,this.toggleImpactSelection,this.toggleGroupSelection);
    let option = await calculate(options,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        option,
    );

    this.chart.render();
   }

   async selectiveGraph(graphName:string,perspective:string, selectNumSectors?:number, selectImpactSelection?:string, selectGroupSelection?:string)
   {

    let selectNumOfSectors = (selectNumSectors != undefined || selectNumSectors != null) ? selectNumSectors : this.toggleNumSelection; 
    this.toggleNumSelection = selectNumOfSectors;
    let selectImpactSelector = (selectImpactSelection != undefined || selectImpactSelection != null)? selectImpactSelection : this.toggleImpactSelection; 
    this.toggleImpactSelection = selectImpactSelector;

    let selectGroupSelector = (selectGroupSelection != undefined || selectGroupSelection != null) ? selectGroupSelection : this.toggleGroupSelection; 
    if(this.toggleGroupSelection !== selectGroupSelector)
    {
        this.toggleGroupSelection = selectGroupSelector;
        const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping(); 
        this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList,this.toggleGroupSelection);
    }

    if(this.perspective !== perspective || this.graphName !== graphName)
    {
        this.perspective = perspective;
        this.graphName = graphName;

        if(perspective === 'final')
        {
            this.sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("final/"+graphName);
        }
        else if(perspective === 'direct')
        {
            this.sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactGhgAPI("direct/"+graphName);
        }
    }

    let nameWithNoSpace = graphName.replace(/\-/g," ");

    let listOfStackGraph = await this.getGraphs(this.sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace,this.toggleNumSelection,this.toggleImpactSelection,this.toggleGroupSelection);
    
    if(this.selectorName === 'construction_materials')
        {
            listOfStackGraph = listOfStackGraph.filter(t => {
                return t._constructionMaterials === 1;
            })
        }

    else if(this.selectorName === 'total_rank')
        {
            listOfStackGraph = listOfStackGraph.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                 return b._totalRank - a._totalRank;
            });
        }
    else if(this.selectorName === 'intensity_rank')
        {
            listOfStackGraph = listOfStackGraph.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                return b._intensityRank - a._intensityRank;
            });
        }
    else if(this.selectorName === 'energy_intensive')
        {
            listOfStackGraph = listOfStackGraph.filter(t => {
                    return t._energyIntensive === 1;
             })
        }

    let option = await calculate(listOfStackGraph,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace, this.toggleImpactSelection);
    
    this.chart.updateOptions(option);
    this.chart.resetSeries();
   }
    
    async getGraphs(sectorContributionToImpact:SectorContributionToImpact[], modelSmartSector:WebModelSmartSector,scc:string,selectNumSectors?:number, selectImpactSelection?:string, selectGroupSelection?:string) : Promise<SumSmartSectorTotalParts[]>
    {
        let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = await this.calculateValues(sectorContributionToImpact,modelSmartSector,scc, selectImpactSelection,selectGroupSelection)

        let sortTopTen:SumSmartSectorTotalParts[] = sortSumSmartSectorTotalParts.slice(0,selectNumSectors);


        return sortTopTen
    }


    async calculateValues(sectorContributionToImpactGhg:SectorContributionToImpact[],modelSmartSector:WebModelSmartSector,scc:string, selectImpactSelection?:string, selectGroupSelection?:string):Promise<SumSmartSectorTotalParts[]> {
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

            let group = modelSmartSector.findGroup(t.emissions_source, sectorMappingList);

            sumPurchasedGroup = (selectGroupSelection === 'group_detail')? group.group_detail : group.group_summary;
        }
        else
        {
            let group = modelSmartSector.findGroup(t.purchased_commodity_code, sectorMappingList);

            sumPurchasedGroup = (selectGroupSelection === 'group_detail')? group.group_detail : group.group_summary;
        }

        var addSector:SmartSector

        if(selectImpactSelection === 'impact_per_purchase')
            {

                 addSector = new SmartSector({
                    sumSectorCode:sumSectorCode,
                    sumSectorName:sumSectorName,
                    sumImpactPerDollar:t.impact_per_purchase,
                    sumPurchasedGroup:sumPurchasedGroup,
                    sumConstructionMaterials:t.construction_materials,
                    sumIntensityRank:t.intensity_rank,
                    sumTotalRank:t.total_rank,
                    sumEnergyIntensive:t.energy_intensive
                  });
            }
        else
            {
                 addSector = new SmartSector({
                    sumSectorCode:sumSectorCode,
                    sumSectorName:sumSectorName,
                    sumtotalImpact:t.total_impact,
                    sumPurchasedGroup:sumPurchasedGroup,
                    sumConstructionMaterials:t.construction_materials,
                    sumIntensityRank:t.intensity_rank,
                    sumTotalRank:t.total_rank,
                    sumEnergyIntensive:t.energy_intensive
                  });
            }

  
          if(smartSectorListGroup.length === 0)
          {
              smartSectorListGroup.push(addSector);
          }
          else
          {
            let smartSectorFound:SmartSector | undefined =  smartSectorListGroup.find( t => 
            {
                if(t._smartSector.sumSectorCode === addSector._smartSector.sumSectorCode &&
                 t._smartSector.sumPurchasedGroup === addSector._smartSector.sumPurchasedGroup){
                     return true;
                     }
            });
      
          if(smartSectorFound !== undefined)
          {
            if(selectImpactSelection === 'impact_per_purchase')
                {

                    smartSectorFound._smartSector.sumImpactPerDollar += addSector._smartSector.sumImpactPerDollar;

                }
            else
                {
                    smartSectorFound._smartSector.sumtotalImpact += addSector._smartSector.sumtotalImpact;

                }
          }
          else
          {
              smartSectorListGroup.push(addSector); 
          }   
         }   
          

        
      });

      this.listSumSmartSectorTotalParts = SumSmartSectorTotal(sectorsList,smartSectorListGroup,this.uniqueSortedMappingGroupNoDuplicates,selectImpactSelection);

      
      let listOfStackGraph
      if(this.selectorName === 'construction_materials')
        {
            listOfStackGraph = this.listSumSmartSectorTotalParts.filter(t => {
                return t._constructionMaterials === 1;
            })
        }

    else if(this.selectorName === 'total_rank')
        {
            listOfStackGraph = this.listSumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                 return b._totalRank - a._totalRank;
            });
        }
    else if(this.selectorName === 'intensity_rank')
        {
            listOfStackGraph = this.listSumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                return b._intensityRank - a._intensityRank;
            });
        }
    else if(this.selectorName === 'energy_intensive')
        {
            listOfStackGraph = this.listSumSmartSectorTotalParts.filter(t => {
                    return t._energyIntensive === 1;
             })
        }

      return listOfStackGraph;
    }


    async selectorFilter(totalRankSelector:{name:string,num:number})
    {
      let nameWithNoSpace = this.graphName.replace(/\-/g," ");
      let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[]
      let sortTopTen:SumSmartSectorTotalParts[] 
      if(totalRankSelector.name === 'total_rank')
        {
            sortSumSmartSectorTotalParts = this.listSumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                return b._totalRank - a._totalRank;
            });
        }
      else if(totalRankSelector.name === 'intensity_rank')
        {
            sortSumSmartSectorTotalParts = this.listSumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
                return b._intensityRank - a._intensityRank;
            });
        }
      else if(totalRankSelector.name === 'construction_materials')
        {
            sortSumSmartSectorTotalParts = this.listSumSmartSectorTotalParts.filter(t => {
                return t._constructionMaterials === 1;
            })
        }
      else if(totalRankSelector.name === 'energy_intensive')
        {
            sortSumSmartSectorTotalParts = this.listSumSmartSectorTotalParts.filter(t => {
                  return t._energyIntensive === 1;
             })
        }

      this.selectorName = totalRankSelector.name;

      if(totalRankSelector.num === undefined || totalRankSelector.num === null)
      {
        this.toggleNumSelection = sortSumSmartSectorTotalParts.length
      }
      else
      {
        this.toggleNumSelection = totalRankSelector.num;
        sortTopTen = sortSumSmartSectorTotalParts.slice(0,totalRankSelector.num);
      }

      let option = await calculate((sortTopTen != undefined || sortTopTen != null) ? sortTopTen:sortSumSmartSectorTotalParts,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace, this.toggleImpactSelection);

      this.chart.updateOptions(option);
      this.chart.resetSeries();
    }

  }