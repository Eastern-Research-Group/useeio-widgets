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
    let options = await this.getValues(this.sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace, this.toggleNumSelection,this.toggleImpactSelection,this.toggleGroupSelection);
    let option = await calculate(options,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace,this.toggleImpactSelection,this.toggleGroupSelection);
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

    let listOfStackGraph = await this.getValues(this.sectorContributionToImpact, this.modelSmartSectorApi, nameWithNoSpace,this.toggleNumSelection,this.toggleImpactSelection,this.toggleGroupSelection);
    
    let option = await calculate(listOfStackGraph,this._chartConfig.model,this.uniqueSortedMappingGroupNoDuplicates, nameWithNoSpace, this.toggleImpactSelection, this.toggleGroupSelection);
    
    this.chart.updateOptions(option);
    this.chart.resetSeries();
   }
    
    async getValues(sectorContributionToImpact:SectorContributionToImpact[], modelSmartSector:WebModelSmartSector,scc:string,selectNumSectors?:number, selectImpactSelection?:string, selectGroupSelection?:string) : Promise<SumSmartSectorTotalParts[]>
    {
        let sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = await this.calculateValues(sectorContributionToImpact,modelSmartSector,scc, selectImpactSelection,selectGroupSelection)
        let sortTopTen:SumSmartSectorTotalParts[] = sortSumSmartSectorTotalParts.slice(0,selectNumSectors);


        return sortTopTen
    }

    async calculateValues(
        sectorContributionToImpactGhg: SectorContributionToImpact[],
        modelSmartSector: WebModelSmartSector,
        scc: string,
        selectImpactSelection?: string,
        selectGroupSelection?: string
      ): Promise<SumSmartSectorTotalParts[]> {
        const sectorMappingList: SectorMapping[] = await modelSmartSector.sectorMapping();
        const sectorsList: Sector[] = await this._chartConfig.model.sectors();
      
        const smartSectorMap = new Map<string, SmartSector>();
      
        const getGroupDetail = (code: string, emissionsSource: string) => {
          const group = modelSmartSector.findGroup(code || emissionsSource, sectorMappingList);
          return selectGroupSelection === 'group_detail' ? group.group_detail : group.group_summary;
        };
      
        for (const t of sectorContributionToImpactGhg) {
          const sumSectorCode = t.sector_code;
          const sumSectorName = selectSectorName(t.sector_code, sectorsList);
          const sumPurchasedGroup = getGroupDetail(t.purchased_commodity_code, t.emissions_source);
          
          const key = `${sumSectorCode}-${sumPurchasedGroup}`;
      
          if (smartSectorMap.has(key)) {
            const existingSector = smartSectorMap.get(key)!;
            if (selectImpactSelection === 'impact_per_purchase') {
              existingSector._smartSector.sumImpactPerDollar += t.impact_per_purchase;
            } else {
              existingSector._smartSector.sumtotalImpact += t.total_impact;
            }
          } else {
            const newSector = new SmartSector({
              sumSectorCode,
              sumSectorName,
              sumPurchasedGroup,
              sumConstructionMaterials: t.construction_materials,
              sumIntensityRank: t.intensity_rank,
              sumTotalRank: t.total_rank,
              sumEnergyIntensive: t.energy_intensive,
              sumModel: t.model,
              sumImpactPerDollar: selectImpactSelection === 'impact_per_purchase' ? t.impact_per_purchase : 0,
              sumtotalImpact: selectImpactSelection !== 'impact_per_purchase' ? t.total_impact : 0,
            });
            smartSectorMap.set(key, newSector);
          }
        }
      
        const smartSectorListGroup = Array.from(smartSectorMap.values());
        this.listSumSmartSectorTotalParts = SumSmartSectorTotal(sectorsList, smartSectorListGroup, this.uniqueSortedMappingGroupNoDuplicates, selectImpactSelection);
      
        let listOfStackGraph: SumSmartSectorTotalParts[] = this.listSumSmartSectorTotalParts;
      
        switch (this.selectorName) {
          case 'construction_materials':
            listOfStackGraph = listOfStackGraph.filter(t => t._constructionMaterials === 1);
            break;
          case 'total_rank':
            listOfStackGraph.sort((a, b) => a._totalRank - b._totalRank);
            break;
          case 'intensity_rank':
            listOfStackGraph.sort((a, b) => a._intensityRank - b._intensityRank);
            break;
          case 'energy_intensive':
            listOfStackGraph = listOfStackGraph.filter(t => t._energyIntensive === 1);
            break;
        }
      
        return listOfStackGraph.filter(t => t._model === "Detail");
      }
      

   async selectorFilter(totalRankSelector: { name: string; num?: number }) {
        const nameWithNoSpace = this.graphName.replace(/-/g, " ");
        
        let filteredResults: SumSmartSectorTotalParts[] = this.listSumSmartSectorTotalParts.filter(t => {
          switch (totalRankSelector.name) {
            case 'construction_materials':
              return t._constructionMaterials === 1;
            case 'energy_intensive':
              return t._energyIntensive === 1;
            default:
              return true; 
          }
        });
      
        if (totalRankSelector.name === 'total_rank') {
          filteredResults.sort((a, b) => a._totalRank - b._totalRank);
        } else if (totalRankSelector.name === 'intensity_rank') {
          filteredResults.sort((a, b) => a._intensityRank - b._intensityRank);
        }
      
        this.selectorName = totalRankSelector.name;
      
        this.toggleNumSelection = totalRankSelector.num ?? filteredResults.length;
        const sortTopTen = filteredResults.slice(0, this.toggleNumSelection);
      
        const option = await calculate(
          sortTopTen,
          this._chartConfig.model,
          this.uniqueSortedMappingGroupNoDuplicates,
          nameWithNoSpace,
          this.toggleImpactSelection,
          this.toggleGroupSelection
        );
      
        this.chart.updateOptions(option);
        this.chart.resetSeries();
      }
  }