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

        let unitLabel:string = '';
        let yaxisTitle = '';
        if (graphTitleName == 'Social Cost of Carbon')
        {
            yaxisTitle = 'Total Impact (Billion dollars)';
            unitLabel = ' Billion dollars';
        }
        else
        {
            yaxisTitle = 'Emissions (MMT CO2e)';
            unitLabel = ' MMT CO2e';
        };

        let colors = data.map( (t)=>
          {
              return (t.purchase_commodity.includes('Direct')? '#4CAF50':'#2E93fA')
          })

      return {
        series: [{
          name: 'Emissions',
          data: data.map(t => t.totalImpact)
        }],
        chart: {
        height: 500,
        type: 'bar' 
      },
      colors: colors,
      plotOptions: {
        bar: {
          columnWidth: '55%',
          distributed: true,
        }
      },
      dataLabels: {
        enabled: false
      },
      legend: {
        show: false
      },
      xaxis: {
        categories: sortedSectorCodesWithNamesWithArray
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
              return "" + val.toFixed(3) + " " + unitLabel
            }
          }
        }
    };
}
