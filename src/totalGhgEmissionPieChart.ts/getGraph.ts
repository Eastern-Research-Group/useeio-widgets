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
        let contrubutionColorList:string[] = [];

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
          let sectorGraphTitle = values._sectorCode + ' - ' +sector_name;

          console.log(values)
          values._contributionList.map(t => {
            sectorPurchasedList.push(t.sectorPurchased)
            contrubutionList.push(t.contribution)

            if(t.sectorPurchased.match("Direct")){
              contrubutionColorList.push('#0074d3')
            }
            else
            {
              contrubutionColorList.push('#D30000')
            }
          });
  

          return {
            series: contrubutionList,
            colors:contrubutionColorList,
            chart: {
            width: 600,
            type: 'pie',
          },
          title:{
            text: sectorGraphTitle +` (${graphName})`,
            align: 'center',
            style: {
              fontSize:  '10px',
            }
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
