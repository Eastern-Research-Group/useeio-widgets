import * as apex from "apexcharts";
import {SortingPercentContribution} from '../smartSectorChart/smartSector'


export async function apexGraph(contributionList:SortingPercentContribution[],sector_name:string,graphName?:string): Promise<apex.ApexOptions> 
    {     
        
        let values  = contributionList.find( t => {
            if(t._sectorName === sector_name){
                return true
            }
        })
        
        let sectorPurchasedList:string[] = [];
        let contrubutionList:number[] = [];

        if(values === undefined)
          {
            return {
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
          }
        else
        {
          values._contributionList.map(t => {
            sectorPurchasedList.push(t.sectorPurchased)
            contrubutionList.push(t.contribution)
          });
  
          let sectorGraphTitle = values._sectorCode + ' - ' +sector_name;

          return {
            series: contrubutionList,
            chart: {
            width: 800,
            type: 'pie',
          },
          title:{
            text: sectorGraphTitle +` (${graphName})`,
            align: 'center'
          },
          labels: sectorPurchasedList,
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
        }
      

      
}
