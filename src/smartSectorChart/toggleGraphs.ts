import * as apex from "apexcharts";
import {sortedSectorCodeList, sortedSeriesList} from '../smartSectorCalc/smartSectorCalculations';
import {SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { WebModel, Sector } from "useeio";


export async function calculate(sortTopTen:SumSmartSectorTotalParts[],model: WebModel,uniqueSortedMapping:string[],titleGraph?:string, impactSelector?:string): Promise<apex.ApexOptions> 
    {       

        let sectorsList:Sector[] = await model.sectors();
        let sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
        let sortedSeries:{name:string,data:number[]}[] = sortedSeriesList(sortTopTen,uniqueSortedMapping,impactSelector);
        
        let sortedSectorCodesWithNamesWithArray: string[][] = sortedSectorCodes.map( t =>
         {
          let sectorName:Sector = sectorsList.find( s => 
            {
              if(s.id === t)
              {
                return true
              }
            })
          
           return  [sectorName.id].concat(sectorName.name)
         });


         let colors = ['#8D5B4C','#2E93fA', '#4CAF50', '#546E7A', '#E91E63', '#FF9800','#9b19f5','#2e2b28','#ab3da9','#A5978B']
         


        return {
            series: sortedSeries,
            colors: colors,
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
                type: 'category',
                categories: sortedSectorCodesWithNamesWithArray,
                labels: {
                  show: true,
                  rotate: -45,
                  rotateAlways: true,
                  hideOverlappingLabels: false,
                  trim: true,
                  minHeight: -100
                }
              },
              yaxis: [
                {
                  title:{
                    
                    text: 'Total Emissions (MMT CO2e)'
                  },
                  min: 0,
                  max: undefined,
                  labels: {
                    formatter: function(val) {
                      return val.toLocaleString();
                    }
                  }
                }
              ],
              legend: {
                position: 'bottom',
              },
              tooltip: {
                enabled: true,
                onDatasetHover: {
                    highlightDataSeries: false,
                },
                x: {
                    show: false
                }
            },
              fill: {
                opacity: 1
              }
        };
    }

    