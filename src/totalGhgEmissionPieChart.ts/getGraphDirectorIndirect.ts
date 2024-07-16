import * as apex from "apexcharts";
import {SortingPercentContribution, SortingPercentContributionIndirectAndDirect} from '../smartSectorChart/smartSector'
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
          let sectorGraphTitle = values._sectorCode + ' - ' +sector_name;

          values._contributionList.map(t => {
            sectorPurchasedList.push(t.directOrIndirect)
            contrubutionList.push(t.contribution)

            if(t.directOrIndirect.match("Direct")){
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
            width: 500,
            type: 'pie',
          },
          title:{
            text: sectorGraphTitle +` (${graphName})`,
            align: 'center',
            floating:false,
            style: {
              fontSize:  '9px',
              fontWeight:  'bold',
            }
          },
          labels: sectorPurchasedList,
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
      

      
}
