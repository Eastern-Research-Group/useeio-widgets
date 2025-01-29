import * as apex from "apexcharts";
import {SortingPercentContribution, SortingPercentContributionIndirectAndDirect, ContributionListForSector, ContributionListForSectorDirectOrIndirect} from '../smartSectorChart/smartSector'
import { wrap } from "module";


export async function apexGraph(contributionList:SortingPercentContributionIndirectAndDirect[],sector_name:string,graphName?:string): Promise<apex.ApexOptions> 
    {     
        
        let values  = contributionList.find( t => {
            if(t._sectorName === sector_name){
                return true
            }
        })
        
        let sectorPurchasedList:string[] = [];
        let contrubutionList:number[] = [];
        let contrubutionColorList:string[] = [];

        if(values === undefined)
          {
            return {
              series: [],
              chart: {
              width: 500,
              type: 'pie',
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
              breakpoint: 400,
              options: {
                chart: {
                  width: 300
                },
                legend: {
                  position: 'bottom'
                }
              }
            }]
            };
          }
        else
        {

          let totalSum:number = 0;
          values._contributionList.map(t => {
            sectorPurchasedList.push(t.directOrIndirect)
            contrubutionList.push(t.contribution)
            totalSum += t.totalImpactSum;

            if(t.directOrIndirect.match("Direct")){
              contrubutionColorList.push('#4CAF50')
            }
            else
            {
              contrubutionColorList.push('#2E93fA')
            }
          });
          let pointSelection:number = 0;

          return {
            series: contrubutionList,
            colors:contrubutionColorList,
            chart: {
            width: 600,
            height:471.8,
            type: 'donut',
            events: {
            dataPointMouseEnter: function() {
                var textElements = document.querySelectorAll('#profile-chart svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "hidden");                
            },
            dataPointSelection: function(event, chartContext, config) {
              
              pointSelection = config.selectedDataPoints[0].length;
              if(pointSelection > 0)
              {
                var textElements = document.querySelectorAll('#profile-chart svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "hidden");   
              }
              else
              {
                var textElements = document.querySelectorAll('#profile-chart svg text');
              textElements[textElements.length - 1].setAttribute("visibility", "visible");  
              }
             

            },
            dataPointMouseLeave: function() {

              if(pointSelection > 0)
              {
                var textElements = document.querySelectorAll('#profile-chart svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "hidden"); 
              }
              else
              {
                var textElements = document.querySelectorAll('#profile-chart svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "visible"); 
              } 
              
          }
        },
            toolbar: {
              show: true,
              tools: {
                  download: false,
                  zoom: false,
                  zoomin: false,
                  zoomout: false,
                  pan: false,
                  reset: false,
              },
              export: {
                  csv: {
                      filename: 'Direct vs Indirect',
                      columnDelimiter: ',',
                      headerCategory: 'Sector Purchased',
                      headerValue: 'Contribution'
                  },
                  svg: {
                      filename: 'Direct vs Indirect'
                  },
                  png: {
                      filename: 'Direct vs Indirect'
                  }
              }
          }},
           plotOptions: {
                      pie:{
                        donut: {
                          size:'80%',
                          labels: {
                            show:true,
                            value:{
                              show:true,
                              formatter: function (val) {
                                let uniqueValue:ContributionListForSectorDirectOrIndirect = values._contributionList.find(t => {
                                  if(t.contribution.toString() == val)
                                    return true
                                });
                      
                                // Return both total and percentage combined in the same label
                                return `${(uniqueValue.totalImpactSum).toFixed(2)} MMT CO2e  (${(uniqueValue.contribution*100).toFixed(2)}%)`;
                            }
                            }
                          }
                        }
                      }
                      },
          labels: sectorPurchasedList,
          responsive: [{
            breakpoint: 480,
            options: {
              chart: {
                width: 600
              },
              legend: {
                position: 'bottom'
              }
            }
          }],
          tooltip: {
            enabled: true,
            y: {
              formatter: function (val) {
                let uniqueValue:ContributionListForSectorDirectOrIndirect = values._contributionList.find(t => {
                  if(t.contribution == val)
                    return true
                });
      
                // Return both total and percentage combined in the same label
                return `${(uniqueValue.totalImpactSum).toFixed(2)} MMT CO2e  (${(uniqueValue.contribution*100).toFixed(2)}%)`;
              }
            }
          },
          annotations: {
            texts: [
              {
                text: `${totalSum.toFixed(2)} MMT CO2e (100%)`,
                x: 250,  
                y: 240,  
                textAnchor: 'middle',  
                foreColor: '#333',  
                fontSize: '18px', 
                fontWeight: 'bold',  
              },
            ],
          },
          };
        }
      

      
}
