import * as apex from "apexcharts";
import {SortedImpactPerPurchaseTopList} from '../smartSectorChart/smartSector';


export async function apexGraph(sortingImpactPerPurchaseWithTopList:SortedImpactPerPurchaseTopList[],sectorName:string,graphTitleName?:string): Promise<apex.ApexOptions> 
    {     
        let data:{
            purchase_commodity: string;
            impactPerPurchase: number;
        }[]
        let values  = sortingImpactPerPurchaseWithTopList.find( t => {
            if(t.sector_name === sectorName){
                return true
            }
        })
        
        data = values.topFifteenImpactPerPurchase.map(t => {
            return {
            purchase_commodity:t.purchaseCommodity,
            impactPerPurchase:t.impactPerPurchase}
        });
        let sectorGraphTitle = values.sector_code + ' - ' +values.sector_name;
        let sortedSectorCodesWithNamesWithArray: string[][] = data.map( t =>
          {
           
            return  t.purchase_commodity.split(' ')
          });
        let yaxisTitle = 'Emissions Intensity (tonnes CO2e per Million $ of Output)';
        if (graphTitleName == 'Social Cost of Carbon')
          {
            yaxisTitle = 'Emissions Intensity (Million $ per Million $ of Output)'
          }

      return {
        series: [{
        name: 'Emissions Intensity',
        data: data.map(t => t.impactPerPurchase)
      }],
        chart: {
        type: 'bar',
        height: 500
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
          text: yaxisTitle
        },
        forceNiceScale: true,
        labels: {
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
            return "" + val.toFixed(3) + ""
          }
        }
      }
      };
}
