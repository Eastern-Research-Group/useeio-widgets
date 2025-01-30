import {  Widget } from "..";
import { WebModel, Sector } from "useeio";
import { modelOfSmartSector, WebModelSmartSector, SectorMapping, PercentContribution } from '../smartSectorWebApi.ts/webApiSmartSector';
import {selectSectorName, uniqueSortedMappingGroupNoDuplicatesList } from '../smartSectorCalc/smartSectorCalculations'
import { SortingPercentContribution} from '../smartSectorChart/smartSector'
import { apexGraph } from "../totalGhgEmissionPieChart.ts/getGraph";
import * as apex from "apexcharts";

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
    perspective:string;
    sector_name:string = 'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    sectorCode:string = '1111A0';
    options:apex.ApexOptions;
    

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
    this.perspective = 'final'
    this.sectorsList = await this._chartConfig.model.sectors();
    this.sector_name = sectorName? sectorName:'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
    this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    let titleNameWithNoSpace = graphName.replace(/\-/g," ");
    this.percentContributionList = await this.modelSmartSectorApi.percentContribution("final/"+graphName);
    this.contributionList = await this.contributionListPerSector(this.percentContributionList);
    this.options = await apexGraph(this.contributionList,this.sector_name,titleNameWithNoSpace);
    this.chart = new ApexCharts(
        document.querySelector(this._chartConfig.selector),
        this.options,
    );

    this.chart.render();
   }

   async changePerspectiveGraph(perspective:string, graphName?:string, sectorName?:string)
   {
    if(this.perspective !== perspective)
      {
        this.perspective = perspective;
        this.graphName = graphName;
        this.percentContributionList = await this.modelSmartSectorApi.percentContribution(this.perspective+"/"+graphName);
        this.contributionList = await this.contributionListPerSector(this.percentContributionList);
        this.changeGraph(graphName,sectorName);
      }
   }

   async changeGraph(graphName?:string, sectorName?:string)
   {
    if(this.graphName !== graphName)
    {
      this.graphName = graphName;
      this.percentContributionList = await this.modelSmartSectorApi.percentContribution(this.perspective+"/"+graphName);
      this.contributionList = await this.contributionListPerSector(this.percentContributionList);
    }

    if(this.uniqueSortedMappingGroupNoDuplicates === undefined || this.uniqueSortedMappingGroupNoDuplicates === null)
    {
      const sectorMappingList:SectorMapping[] = await this.modelSmartSectorApi.sectorMapping();  
      this.uniqueSortedMappingGroupNoDuplicates = uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList);
    }

    this.sectorsList = await this._chartConfig.model.sectors();
    this.sector_name = sectorName? sectorName:'Fresh soybeans, canola, flaxseeds, and other oilseeds';
    let titleNameWithNoSpace = graphName.replace(/\-/g," ");

    this.options = await apexGraph(this.contributionList,this.sector_name,titleNameWithNoSpace);

    this.chart.updateOptions(this.options);
    this.chart.resetSeries();
   }

   async updateGraph(sectorName?:string,sectorCode?:string)
   {
    this.sectorCode = sectorCode;
    this.options = await apexGraph(this.contributionList ,sectorName ,this.graphName.replace(/\-/g," "));
    this.chart.updateOptions(this.options);
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
            contribution:t.contribution,
            totalImpactsSum:t.total_impacts_sum,
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
                contribution:t.contribution,
                totalImpactsSum:t.total_impacts_sum,
              });
        }
        else
        {
          let sortingContribution =  new SortingPercentContribution(
            t.sector,
            selectSectorName(t.sector,sectorsList),
            {
              sectorPurchased:t.sector_purchased_detail,
              contribution:t.contribution,
              totalImpactsSum:t.total_impacts_sum,
            }
          );
  
          sortedPercentList.push(sortingContribution);
        }
        
      }
    
    });


    return sortedPercentList;
   }

   addExportEventListeners(type:string) {
    if(type !== null || type ! == undefined)
      {
    let titleName:string;
    if(this.perspective == 'final')
      {
        titleName = `Sector: ${this.sectorCode}, ${this.graphName.replace(/\-/g," ").replace(' AR6 ',"-")}, Point of Consumption`

      }
    else
      {
        titleName = `Sector: ${this.sectorCode}, ${this.graphName.replace(/\-/g," ").replace(' AR6 ',"-")}, Supply Chain`
      }

        // Show the title before export
        this.chart.updateOptions({
          ...this.options,
          chart: {
            toolbar: {
              show: true,
              tools: {
                  download: true,
                  zoom: false,
                  zoomin: false,
                  zoomout: false,
                  pan: false,
                  reset: false,
              },
              export: {
                  csv: {
                      filename: `${titleName}-Detailed`,
                      columnDelimiter: ',',
                     headerCategory: 'Sector Purchased',
                      headerValue: 'Contribution'
                  },
                  svg: {
                      filename: `${titleName}-Detailed`,
                  },
                  png: {
                      filename: `${titleName}-Detailed`
                  }
              }
          }},
          title: {
            text: titleName, // Title visible before exporting
          }
    });

  // Delay to ensure title is updated before export
  setTimeout(() => {
    if (type === "png") {
      this.chart.exports.exportToPng();
    } else if (type === "svg") {
      this.chart.exports.exportToSVG();
    } else if (type === "csv") {
      this.chart.dataURI().then(() => {
        this.chart.exports.exportToCSV({
          series: this.options['series'],
          columnDelimiter: ',',
          fileName:`${titleName}-Detailed`.replace(',','-')
        }); 
      });      
    }

    // Hide the title after export
    this.chart.updateOptions({
      ...this.options,
      title: {
        text: "", 
      },
    });
  }, 100);
}}
  }
  

  