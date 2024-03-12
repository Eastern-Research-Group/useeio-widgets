import * as apex from "apexcharts";
import {sortedSectorCodeList, sortedSeriesList} from '../smartSectorCalc/smartSectorCalculations'
import {SumSmartSectorTotalParts} from '../smartSectorChart/smartSector'

export async function calculate(sortTopTen:SumSmartSectorTotalParts[],uniqueSortedMapping:string[],titleGraph:string): Promise<apex.ApexOptions> 
    {       
    
        let sortedSectorCodes: string[] = sortedSectorCodeList(sortTopTen);
        let sortedSeries:{name:string,data:number[]}[] = sortedSeriesList(sortTopTen,uniqueSortedMapping);
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
              title:{
                text: titleGraph,
                align: 'center'
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
                    
                    text: titleGraph.includes('Social') ? 'Impact per $ (Million Dollars)':'Total Impact (MMT CO2e)'
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
              fill: {
                opacity: 1
              }
        };
    }

    