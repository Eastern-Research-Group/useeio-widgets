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
        let sortedSectorCodesWithNamesWithArray: string[][] = data.map( t =>
          {
           
            return  t.purchae_commodity.split(' ')
          });
      

      return {
        series: [{
        name: 'Emissions Intensity',
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
          text: 'Emissions Intensity (Metric Tons CO2e per Million Dollars of Output)'
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
