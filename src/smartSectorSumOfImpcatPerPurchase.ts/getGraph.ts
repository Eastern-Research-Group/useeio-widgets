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
        
        let unitLabel:string = '';
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
        let yaxisTitle = 'Emissions Intensity (Metric tons CO2e per Million $ of Output)';
        unitLabel = 'tons CO2e per Million $ of Output';
        if (graphTitleName == ' Social Cost of Carbon')
          {
            yaxisTitle = 'Emissions Intensity (Million $ per Million $ of Output)'
            unitLabel = ' Million $ per Million $ of Output';
          }

        let colors = data.map( (t)=>
          {
              return (t.purchase_commodity.includes('Direct')? '#4CAF50':'#2E93fA')
          })

        let totalSum:number = 0;
          values.topFifteenImpactPerPurchase.forEach(t => {
            totalSum += t.impactPerPurchase
        });

        console.log(totalSum)
      return {
        series: [{
          name: 'Emissions Intensity',
          data: data.map(t => t.impactPerPurchase)
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
      annotations: {
        yaxis: [{
          y: values.topFifteenImpactPerPurchase[0].impactPerPurchase,  
          borderColor: 'white',
          label: {
            text: `Total ${unitLabel} for sector ${sectorName}: ${totalSum.toFixed(2)}`,  
            style:{
              fontWeight:'bold',
            }
          }
        }]
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
          max: values.topFifteenImpactPerPurchase[0].impactPerPurchase + values.topFifteenImpactPerPurchase[9].impactPerPurchase,
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
