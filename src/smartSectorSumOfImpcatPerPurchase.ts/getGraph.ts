import * as apex from "apexcharts";
import {SortedImpactPerPurchaseTopList} from '../smartSectorChart/smartSector';


export async function apexGraph(sortingImpactPerPurchaseWithTopList:SortedImpactPerPurchaseTopList[],sectorName:string,graphTitleName?:string): Promise<apex.ApexOptions> 
    {     
        console.log(sortingImpactPerPurchaseWithTopList)
        let data:{
            purchae_commodity: string;
            impactPerPurchase: number;
        }[]
        let values  = sortingImpactPerPurchaseWithTopList.find( t => {
            if(t.sector_name === sectorName){
                return true
            }
        })
        
        console.log(values)
        data = values.topFifteenImpactPerPurchase.map(t => {
            return {
            purchae_commodity:t.purchaseCommodity,
            impactPerPurchase:t.impactPerPurchase}
        });
        let sectorGraphTitle = values.sector_code + ' - ' +values.sector_name;
        let sortedSectorCodesWithNamesWithArray: string[][] = data.map( t =>
          {
           
            return  t.purchae_commodity.split(' ')
          });
      

      return {
        series: [{
        name: 'GHG Emissions Intensity in metric tons CO2e per million dollars of output',
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
        text: sectorGraphTitle+` (${graphTitleName})`,
        align: 'center'
      },
      xaxis: {
        categories: sortedSectorCodesWithNamesWithArray,
      },
      yaxis: {
        title: {
          text: 'GHG Intensity (Million Tons CO2e/Million $)'
        },labels: {
          formatter: function(val) {
            return (Math.round(val * 100) / 100).toFixed(2);
          }
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
