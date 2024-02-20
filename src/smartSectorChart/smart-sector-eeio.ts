import * as apex from "apexcharts";
import { Widget } from "..";
import { WebModel, Sector, WebApiConfig } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from './webApiSmartSector';
import {selectSectorName, smartSectorCalc, SumSmartSectorTotal, sortedSectorCodeList, sortedSeriesList} from '../smartSectorCalc/smartSectorCalculations'
import {SmartSector, SumSmartSectorTotalParts} from '../smartSectorChart/smartSector'


export interface SmartSectorChartConfig {
    model: WebModel;
    endpoint:string;
    selector: string;
}


export class SmartSectorEEIO extends Widget {

    constructor(private _chartConfig: SmartSectorChartConfig) {
        super();
    }

    private uniqueSortedMappingGroup(sortedSectorMappingByGroup:SectorMapping[]) : string[]{
        const sortedMappingGroupList:string[] = sortedSectorMappingByGroup.map( t => 
            {
                return t.group;
            })
        return sortedMappingGroupList.filter((value, index) => sortedMappingGroupList.indexOf(value) === index)   
    }
    

    async update() {
       const modelSmartSector = this.modelSmartSector({
                endpoint: this._chartConfig.endpoint as string,
                model: this._chartConfig.model.id() as string,
                asJsonFiles: true,
        
        })

        const impactoutputs:ImpactOutput[] = await modelSmartSector.impactOutPut();
        const sectorContributionToImpactGhg:SectorContributionToImpact[] = await modelSmartSector.sectorContributionToImpactGhg();
        const sectorMappingList:SectorMapping[] = await modelSmartSector.sectorMapping();
        const sectorsList:Sector[] = await this._chartConfig.model.sectors();

        const sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
            return a.group.localeCompare(b.group);
        });


        const uniqueSortedMappingGroupNoDuplicates:string[] = this.uniqueSortedMappingGroup(sortedSectorMappingByGroup);
        

        const smartSectorListGroup: SmartSector[]  = []
        sectorContributionToImpactGhg.forEach((t, i) => {
              const sumSectorCode = t.sector_code;
              const sumSectorName =   selectSectorName(t.sector_code,sectorsList);
              const sumImpactTotal =  (((t.impact_per_purchase)*(modelSmartSector.findSectorOutput(t.sector_code,impactoutputs)))/1000000000);
              const sumPurchasedGroup =  modelSmartSector.findPurchasedGroup(t.purchased_commodity_code,sectorMappingList);

              smartSectorCalc(smartSectorListGroup,new SmartSector({
                sumSectorCode:sumSectorCode,
                sumSectorName:sumSectorName,
                sumtotalImpact:sumImpactTotal,
                sumPurchasedGroup:sumPurchasedGroup
            }))
        });

        const sumSmartSectorTotalParts: SumSmartSectorTotalParts[] = SumSmartSectorTotal(sectorsList,smartSectorListGroup,uniqueSortedMappingGroupNoDuplicates);

        const sortSumSmartSectorTotalParts:SumSmartSectorTotalParts[] = sumSmartSectorTotalParts.sort((a: SumSmartSectorTotalParts, b: SumSmartSectorTotalParts): any => {
            return b._totalSectorCodeSummationImpact - a._totalSectorCodeSummationImpact;
        });

        const sortTopTen:SumSmartSectorTotalParts[] = sortSumSmartSectorTotalParts.slice(0,10);





        const options = await this.calculate(sortTopTen,uniqueSortedMappingGroupNoDuplicates);
        
        const chart = new ApexCharts(
            document.querySelector(this._chartConfig.selector),
            options,
        );
        chart.render();
    }


     modelSmartSector(conf: WebApiConfig & {model: string}): WebModelSmartSector {
        return modelOfSmartSector(conf);
    }

    private async calculate(sortTopTen:SumSmartSectorTotalParts[],uniqueSortedMapping:string[]): Promise<apex.ApexOptions> {       
    
        const sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
        const sortedSeries:{name:string,data:number[]}[] = sortedSeriesList(sortTopTen,uniqueSortedMapping);
        return {
            series: sortedSeries,
            colors:['#8D5B4C','#2E93fA', '#4CAF50', '#546E7A', '#E91E63', '#FF9800','#9b19f5','#2e2b28','#ab3da9','#A5978B'],
                chart: {
                type: 'bar',
                height:450 ,
                stacked: true,
                toolbar: {
                  show: true
                }
              },
              responsive: [{
                breakpoint: 480,
                options: {
                  legend: {
                    position: 'bottom',
                    offsetX: -10,
                    offsetY: 0
                  }
                }
              }],
              plotOptions: {
                bar: {
                  horizontal: false,
                  dataLabels: {
                    total: {
                      enabled: false
                    }
                  }
                },
              },
              dataLabels: {
                enabled: false
              },
              xaxis: {
                title:{
                  text:'Sector'
                },
                categories: sortedSectorCodes,
              },
              yaxis: [
                {
                  title:{
                    text:'Total Impact (MMT CO2e)'
                  },
                  labels: {
                    formatter: function(val) {
                      return (Math.round(val * 10) / 10).toString();
                    }
                  }
                }
              ],
              legend: {
                position: 'right',
                offsetY: 40
              },
              fill: {
                opacity: 1
              }
        };
    }

}
