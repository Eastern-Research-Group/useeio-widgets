import * as apex from "apexcharts";
import {SortedImpactPerPurchaseTopList} from '../smartSectorChart/smartSector';


export async function apexGraph(sortingImpactPerPurchaseWithTopList:SortedImpactPerPurchaseTopList[],sectorName:string,graphTitleName?:string): Promise<apex.ApexOptions> 
    {     
        let data:{
            purchase_commodity: string;
            totalImpact: number;
        }[]
        let values  = sortingImpactPerPurchaseWithTopList.find( t => {
            if(t.sector_name === sectorName){
                return true
            }
        })
        
        data = values.topFifteenTotalImpact.map(t => {
            return {
            purchase_commodity:t.purchaseCommodity,
            totalImpact:t.totalImpact}
        });

        let sortedSectorCodesWithNamesWithArray: string[][] = data.map( t =>
          {
           
            return  t.purchase_commodity.split(' ')
          });

        let yaxisTitle = '';
        if (graphTitleName == 'Social Cost of Carbon')
        {
            yaxisTitle = 'Total Impact (Billion dollars)'
        }
        else
        {
            yaxisTitle = 'Total Emissions (MMT CO2e)'
        };

      return {
        series: [{
        name: 'Total Emissions',
        data: data.map(t => t.totalImpact)
      }],
        chart: {
        type: 'bar',
        height: 500,
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
