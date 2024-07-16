import * as apex from "apexcharts";
import {sortedSectorCodeList, sortedSeriesList} from '../smartSectorCalc/smartSectorCalculations';
import {SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { WebModel, Sector } from "useeio";


export async function calculate(sortTopTen:SumSmartSectorTotalParts[],model: WebModel,uniqueSortedMapping:string[],titleGraph?:string): Promise<apex.ApexOptions> 
    {       

        let sectorsList:Sector[] = await model.sectors();
        let sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
        let sortedSeries:{name:string,data:number[]}[] = sortedSeriesList(sortTopTen,uniqueSortedMapping);
        
        let sortedSectorCodesWithNamesWithArray: string[][] = sortedSectorCodes.map( t =>
         {
          let sectorName:Sector = sectorsList.find( s => 
            {
              if(s.id === t)
              {
                return true
              }
            })
           return  [sectorName.id].concat(sectorName.name.split(' '))
         });

         let colors = ['#8D5B4C','#2E93fA', '#4CAF50', '#546E7A', '#E91E63', '#FF9800','#9b19f5','#2e2b28','#ab3da9','#A5978B']
         if(sortedSectorCodesWithNamesWithArray.length > 10)
         {
          colors = ['#98FB98','#B0E0E6', '#008000', '#800000', '#FF8C00',
             '#D2691E','#8A2BE2','#5F9EA0','#E6E6FA','#FAFAD2',
             '#9932CC','#FF00FF','#D8BFD8','#FAF0E6','#2F4F4F',
             '#FFDEAD','#006400','#9400D3','#BDB76B','#808000',
             '#2E8B57','#7CFC00','#00008B','#C71585','#00BFFF']
         }

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
                title:{
                  text:'Sector'
                },
                
                categories: sortedSectorCodesWithNamesWithArray,
              },
              yaxis: [
                {
                  title:{
                    
                    text: 'Total Emissions (MMT CO2e)'
                  },
                  labels: {
                    formatter: function(val) {
                      return val.toLocaleString();
                    }
                  }
                }
              ],
              legend: {
                position: 'right',
                offsetY: 40
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

    