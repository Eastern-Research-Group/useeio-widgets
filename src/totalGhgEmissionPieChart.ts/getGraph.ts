import * as apex from "apexcharts";
import {ContributionListForSector, SortingPercentContribution} from '../smartSectorChart/smartSector'


export async function apexGraph(contributionList:SortingPercentContribution[],sector_name:string,graphName?:string): Promise<apex.ApexOptions> 
    {     
        
        let values  = contributionList.find( t => {
            if(t._sectorName === sector_name){
                return true
            }
        })
        
        let totalImpactsList:number[] = [];
        let sectorPurchasedList:string[] = [];
        let contrubutionList:number[] = [];
        let contrubutionColorList:string[] = [];

        if(values === undefined)
          {
            var options:apex.ApexOptions = {
              series: [],
              chart: {
              width: 800,
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
            };

            return options;
          }
        else
        {

          let totalSum:number = 0;
          values._contributionList.map(t => {
            sectorPurchasedList.push(t.sectorPurchased)
            contrubutionList.push(t.contribution)
            totalImpactsList.push(t.totalImpactsSum)
            totalSum += t.totalImpactsSum;
            if(t.sectorPurchased.match("Agriculture")){
              contrubutionColorList.push('#8D5B4C')
            }
            else if(t.sectorPurchased.match("Construction")){
              contrubutionColorList.push('#2E93fA')
            }else if(t.sectorPurchased.match("Fuels")){
              contrubutionColorList.push('#546E7A')
            }else if(t.sectorPurchased.match("Manufacturing")){
              contrubutionColorList.push('#E91E63')
            }else if(t.sectorPurchased.match("Minerals")){
              contrubutionColorList.push('#FF9800')
            }else if(t.sectorPurchased.match("Other")){
              contrubutionColorList.push('#9b19f5')
            }else if(t.sectorPurchased.match("Purchased Electricity")){
              contrubutionColorList.push('#2e2b28')
            }else if(t.sectorPurchased.match("Transport")){
              contrubutionColorList.push('#ab3da9')
            }else if(t.sectorPurchased.match("Utilities")){
              contrubutionColorList.push('#A5978B')
            }
            else{
              contrubutionColorList.push('#4CAF50')
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
                var textElements = document.querySelectorAll('#profile-chart-details svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "hidden") 
                
            },
            dataPointSelection: function(event, chartContext, config) {
              
              pointSelection = config.selectedDataPoints[0].length;
              if(pointSelection > 0)
              {
                var textElements = document.querySelectorAll('#profile-chart-details svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "hidden")
              }
              else
              {
                var textElements = document.querySelectorAll('#profile-chart-details svg text');
              textElements[textElements.length - 1].setAttribute("visibility", "visible");
              }
             

            },
            dataPointMouseLeave: function() {

              if(!(pointSelection > 0))
              {
                var textElements = document.querySelectorAll('#profile-chart-details svg text');
                textElements[textElements.length - 1].setAttribute("visibility", "visible"); 
              }
             
          },          
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
                      filename: 'Detailed',
                      columnDelimiter: ',',
                     headerCategory: 'Sector Purchased',
                      headerValue: 'Contribution'
                  },
                  svg: {
                      filename: 'Detailed'
                  },
                  png: {
                      filename: 'Detailed'
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
                                let uniqueValue:ContributionListForSector = values._contributionList.find(t => {
                                  if(t.contribution.toString() == val)
                                    return true
                                });
                      
                                // Return both total and percentage combined in the same label
                                return `${(uniqueValue.totalImpactsSum).toFixed(2)} MMT CO2e  (${(uniqueValue.contribution*100).toFixed(2)}%)`;
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
                let uniqueValue:ContributionListForSector = values._contributionList.find(t => {
                  if(t.contribution == val)
                    return true
                });
      
                // Return both total and percentage combined in the same label
                return `${(uniqueValue.totalImpactsSum).toFixed(2)} MMT CO2e  (${(uniqueValue.contribution*100).toFixed(2)}%)`;
              }
            }
          },
          annotations: {
            texts: [
              {
                text: `${totalSum.toFixed(2)} MMT CO2e (100%)`, 
                x: 220, 
                y: 220,  
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
