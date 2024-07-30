import {  Widget } from "..";
import { WebModel, Sector } from "useeio";
import { modelOfSmartSector, WebModelSmartSector, SectorMapping, PercentContribution } from '../smartSectorWebApi.ts/webApiSmartSector';
import {selectSectorName, uniqueSortedMappingGroupNoDuplicatesList } from '../smartSectorCalc/smartSectorCalculations'
import { SortingPercentContribution} from '../smartSectorChart/smartSector'
import { apexGraph } from "../totalGhgEmissionPieChart.ts/getGraph";

export interface SmartSectorChartConfig {
    model: WebModel;
    endpoint:string;
    selector: string;
}


export class PiePercentContribution extends Widget 
{
    chart:ApexCharts;
    modelSmartSectorApi:WebModelSmartSector;
    uniqueSortedMappingGroupNoDuplicates:string[];
    percentContributionList:PercentContribution[];
    contributionList:SortingPercentContribution[];
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
    this.percentContributionList = await this.modelSmartSectorApi.percentContribution(graphName);
    this.contributionList = await this.contributionListPerSector(this.percentContributionList);
    let options = await apexGraph(this.contributionList,sector_name,titleNameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        options,
    );

    this.chart.render();
   }

   async changeGraph(graphName?:string, sectorName?:string)
   {
    if(this.graphName !== graphName)
    {
      this.graphName = graphName;
      this.percentContributionList = await this.modelSmartSectorApi.percentContribution(graphName);
      this.contributionList = await this.contributionListPerSector(this.percentContributionList);
    }

    if(this.uniqueSortedMappingGroupNoDuplicates === undefined || this.uniqueSortedMappingGroupNoDuplicates === null)
    {
      const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
      this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    }

    this.sectorsList = await this._chartConfig.model.sectors();
    let sector_name:string = sectorName? sectorName:'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    let titleNameWithNoSpace = graphName.replace(/\-/g," ");

    let options = await apexGraph(this.contributionList,sector_name,titleNameWithNoSpace);

    this.chart.updateOptions(options);
    this.chart.resetSeries();
   }

   async updateGraph(sectorName?:string)
   {
 
    let options = await apexGraph(this.contributionList ,sectorName ,this.graphName.replace(/\-/g," "));
    this.chart.updateOptions(options);
    this.chart.resetSeries();
   }

   getGraph():string{
    return this.graphName
   }

   async contributionListPerSector(sectorContribution:PercentContribution[]):Promise<SortingPercentContribution[]>
  {
    const sectorsList:Sector[] = await this._chartConfig.model.sectors();
    let sortedPercentList:SortingPercentContribution[] = []
  

    sectorContribution.forEach((t) => 
    {
      if(sortedPercentList.length === 0)
      {

        let sortingContribution =  new SortingPercentContribution(
          t.sector,
          selectSectorName(t.sector,sectorsList),
          {
            sectorPurchased:t.sector_purchased_detail,
            contribution:t.contribution
          }
        );


        sortedPercentList.push(sortingContribution);
      }
      else
      {
        let contributionPercentageFound:SortingPercentContribution | undefined =  sortedPercentList.find( i => 
         {
            if(t.sector === i._sectorCode)
            {
                return true;
            }
         });
  
        if(contributionPercentageFound !== undefined)
        { 
          
              contributionPercentageFound.addContributionSectorList({
                sectorPurchased:t.sector_purchased_detail,
                contribution:t.contribution
              });
        }
        else
        {
          let sortingContribution =  new SortingPercentContribution(
            t.sector,
            selectSectorName(t.sector,sectorsList),
            {
              sectorPurchased:t.sector_purchased_detail,
              contribution:t.contribution
            }
          );
  
          sortedPercentList.push(sortingContribution);
        }
        
      }
    
    });


    return sortedPercentList;
   }
  }
  

  