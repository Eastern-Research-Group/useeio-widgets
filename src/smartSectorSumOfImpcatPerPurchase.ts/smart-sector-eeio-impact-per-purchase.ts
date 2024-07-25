import {  Widget } from "..";
import { WebModel, Sector } from "useeio";
import { modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact } from '../smartSectorWebApi.ts/webApiSmartSector';
import {selectSectorName, uniqueSortedMappingGroupNoDuplicatesList } from '../smartSectorCalc/smartSectorCalculations'
import {SortedImpactPerPurchaseTopList, SortingImpactPerPurchaseWithTop, ImpactPerPurchaseSector} from '../smartSectorChart/smartSector'
import { apexGraph } from "../smartSectorSumOfImpcatPerPurchase.ts/getGraph";

export interface SmartSectorChartConfig {
    model: WebModel;
    endpoint:string;
    selector: string;
}


export class SmartSectorEEIOImpactPurchasePerSector extends Widget 
{
    chart:ApexCharts;
    modelSmartSectorApi:WebModelSmartSector;
    uniqueSortedMappingGroupNoDuplicates:string[];
    sectorContributionToImpact:SectorContributionToImpact[];
    getTopValuesFromSectors:SortedImpactPerPurchaseTopList[];
    sectorsList:Sector[];
    sectorsListlowerCase:String[];
    graphName:string = '';
    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
        this.modelSmartSectorApi = modelOfSmartSector({
            endpoint: this._chartConfig.endpoint as string,
            model: this._chartConfig.model.id() as string,
            asJsonFiles: true
    });

    }
    
    async update() {}


  async init(graphName?:string, sectorName?:string)
   {
    this.graphName = graphName;
    this.sectorsList = await this._chartConfig.model.sectors();
    let sector_name:string = sectorName? sectorName:'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    let titleNameWithNoSpace = graphName.replace(/\-/g," ");
    this.sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI("final/"+graphName);
    this.getTopValuesFromSectors = await this.getTopFifteenImpactPerPurchaseWithGroup(this.sectorContributionToImpact,this.modelSmartSectorApi);

    let options = await apexGraph(this.getTopValuesFromSectors,sector_name, titleNameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        options,
    );

    this.chart.render();
   }

   async changeGraph(graphName?:string, sectorName?:string)
   {
    this.graphName = graphName;
    this.sectorsList = await this._chartConfig.model.sectors();
    let sector_name:string = sectorName? sectorName:'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    let titleNameWithNoSpace = graphName.replace(/\-/g," ");
    this.sectorContributionToImpact = [];
    this.getTopValuesFromSectors = [];
    this.sectorContributionToImpact = await this.modelSmartSectorApi.sectorContributionToImpactRankedGhgAPI("final/"+graphName);
    this.getTopValuesFromSectors = await this.getTopFifteenImpactPerPurchaseWithGroup(this.sectorContributionToImpact,this.modelSmartSectorApi);

    let options = await apexGraph(this.getTopValuesFromSectors,sector_name, titleNameWithNoSpace);
    this.chart.updateOptions(options);
    this.chart.resetSeries();
   }

   async updateGraph(sectorName?:string)
   {
 
    let options = await apexGraph(this.getTopValuesFromSectors,sectorName,this.graphName.replace(/\-/g," "));
    this.chart.updateOptions(options);
    this.chart.resetSeries();
   }

   getGraph():string{
    return this.graphName
   }

   async getTopFifteenImpactPerPurchaseWithGroup(sectorContributionToImpactGhg:SectorContributionToImpact[],modelSmartSector:WebModelSmartSector):Promise<SortedImpactPerPurchaseTopList[]>
  {
    const sectorMappingList:SectorMapping[] = await modelSmartSector.sectorMapping();
    const sectorsList:Sector[] = await this._chartConfig.model.sectors();
    let sortListWithTop15OfEachSector:SortingImpactPerPurchaseWithTop[] = []
  
    sectorContributionToImpactGhg.forEach((t, i) => 
    {
      if (t.impact_per_purchase > 0.001) {

      let purchasedGroup = modelSmartSector.findPurchasedGroup(t.purchased_commodity_code,sectorMappingList);
      let sectorName = selectSectorName(t.sector_code,sectorsList);
      let purchaseCommodity
      if(purchasedGroup == "All Others" || purchasedGroup == undefined)
      {
        purchaseCommodity = "All Others"
      }
      else
        purchaseCommodity= selectSectorName(t.purchased_commodity_code,sectorsList);

      if(sortListWithTop15OfEachSector.length === 0)
      {

        let sortingImpactPerPurchaseWithTop15 =  new SortingImpactPerPurchaseWithTop(
          t.sector_code,
          sectorName,
          {
            sectorCode:t.sector_code,
            purchaseCommodity:purchaseCommodity,
            impactPerPurchase:t.impact_per_purchase,
            purchasedGroup:purchasedGroup
          }
        );

        sortListWithTop15OfEachSector.push(sortingImpactPerPurchaseWithTop15);
      }
      else
      {
        let sortingImpactPerPurchaseWithTop15:SortingImpactPerPurchaseWithTop | undefined =  sortListWithTop15OfEachSector.find( i => 
         {
            if(t.sector_code === i._sectorCode)
            {
                return true;
            }
         });
  
        if(sortingImpactPerPurchaseWithTop15 !== undefined)
        { 
          sortingImpactPerPurchaseWithTop15.addSmartSectorsByCommodityGroup({
            sectorCode:t.sector_code,
            purchaseCommodity:purchaseCommodity,
            impactPerPurchase:t.impact_per_purchase,
            purchasedGroup:purchasedGroup
          });
        }
        else
        {
          let sortingImpactPerPurchaseWithTop15 =  new SortingImpactPerPurchaseWithTop(
            t.sector_code,
            sectorName,
            {
              sectorCode:t.sector_code,
              purchaseCommodity:purchaseCommodity,
              impactPerPurchase:t.impact_per_purchase,
              purchasedGroup:purchasedGroup
            }
          );
  
          sortListWithTop15OfEachSector.push(sortingImpactPerPurchaseWithTop15);
        }
        
      }
    }
    });

    let sortedImpactPerPurchaseTopList:SortedImpactPerPurchaseTopList[] = sortListWithTop15OfEachSector.map(t => {
      return {
        sector_code: t._sectorCode,
        sector_name: t._sectorName,
        topFifteenImpactPerPurchase: t._smartSectors.slice(0,15)
      }
      
    })


    return sortedImpactPerPurchaseTopList;
   }
  }
  

  