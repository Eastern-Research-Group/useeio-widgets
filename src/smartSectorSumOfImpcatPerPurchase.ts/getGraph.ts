import * as apex from "apexcharts";
import {SortedImpactPerPurchaseTopList} from '../smartSectorChart/smartSector';


export async function apexGraph(sortingImpactPerPurchaseWithTopList:SortedImpactPerPurchaseTopList[],sectorName:string,graphTitleName?:string): Promise<apex.ApexOptions> 
    {     
        
        let data:{
            purchae_commodity: string;
            impactPerPurchase: number;
        }[]

        let values  = sortingImpactPerPurchaseWithTopList.find( t => {
            if(t.sector_name === sectorName){
                return true
            }
        })

        data = values.topFifteenImpactPerPurchase.map(t => {
            return {
            purchae_commodity:t.purchaseCommodity,
            impactPerPurchase:t.impactPerPurchase}
        });

        let sectorGraphTitle = values.sector_code + ' - ' +values.sector_name;
      
      

      return {
        series: [{
        name: 'Impact per purchase',
        data: data.map(t => t.impactPerPurchase)
      }],
        chart: {
        type: 'bar',
        height: 350
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%'
              },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      title:{
        text: sectorGraphTitle,
        align: 'center'
      },
      xaxis: {
        categories: data.map(t => t.purchae_commodity),
        title:{     
          text: 'Purchased Commodities',
        },
      },
      yaxis: {
        title: {
          text: 'Impact per $'
        }
      },
      fill: {
        opacity: 1
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return "" + val + ""
          }
        }
      }
      };
}
