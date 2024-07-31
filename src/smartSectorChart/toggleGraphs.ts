import * as apex from "apexcharts";
import {sortedSectorCodeList, sortedSeriesList} from '../smartSectorCalc/smartSectorCalculations';
import {SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { WebModel, Sector } from "useeio";


export async function calculate(sortTopTen:SumSmartSectorTotalParts[],model: WebModel,uniqueSortedMapping:string[],titleGraph?:string, impactSelector?:string): Promise<apex.ApexOptions> 
    {       

      if(sortTopTen.length > 0){
        let sectorsList:Sector[] = await model.sectors();
        let sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
        let sortedSeries:{name:string,data:number[]}[] = sortedSeriesList(sortTopTen,uniqueSortedMapping,impactSelector);
        let yaxisTitle = '';
        if (impactSelector == 'impact_per_purchase')
          {
            if (titleGraph == 'Social Cost of Carbon')
              {
                yaxisTitle = 'Emissions Intensity (Million $ per Million $ of Output)'
              }
            else
              {
                yaxisTitle = 'Emissions Intensity (tonnes CO2e per Million $ of Output)'
              };
          }
        else
          {
            if (titleGraph == 'Social Cost of Carbon')
              {
                yaxisTitle = 'Total Impact (Billion dollars)'
              }
            else
              {
                yaxisTitle = 'Total Emissions (MMT CO2e)'
              };
          };
          
        let sortedSectorCodesWithNamesWithArray: string[][] = sortedSectorCodes.map( t =>
         {
          let sectorName:Sector = sectorsList.find( s => 
            {
              if(s.id === t)
              {
                return true
              }
            })
          
           return  [sectorName.name].concat(sectorName.id)
         });


         let colors = ['#8D5B4C','#2E93fA', '#4CAF50', '#546E7A', '#E91E63', '#FF9800','#9b19f5','#2e2b28','#ab3da9','#A5978B']
         


        return {
            series: sortedSeries,
            colors: colors,
                chart: {
                type: 'bar',
                height: 500,
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
                    
                    text: yaxisTitle
                  },
                  forceNiceScale: true,
                  min: 0,
                  max: undefined,
                  labels: {
                    formatter: function(val) {
                      return val.toFixed(1);
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
                y: {
                  formatter: function (val) {
                    return "" + val.toFixed(3) + ""
                  }
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
      else
      {
        return {
          series: [{name:"NA",data:[]}],
          chart: {
            type: 'bar',
            height: 500,
            stacked: true,
            toolbar: {
              show: true
            }
          },
        title:{
          text: 'No Data',
          align: 'center'
        },
        labels: [],
        noData: {
          text: "There's no data",
          align: 'center',
          verticalAlign: 'middle',
          offsetX: 0,
          offsetY: 0
          },
        responsive: [{
          breakpoint: 480,
          options: {
            chart: {
              width: 400
            },
            legend: {
              position: 'bottom'
            }
          }
        }]
        }
      }
        
    }

    