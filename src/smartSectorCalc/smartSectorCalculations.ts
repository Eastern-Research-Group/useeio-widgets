
import {SmartSector, SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { Sector } from "useeio";


export function smartSectorCalc(smartSectorList:SmartSector[],addSector:SmartSector)
{
    if(smartSectorList.length === 0){
        smartSectorList.push(addSector);
    }
    else
    {
      const smartSectorFound:SmartSector | undefined =  smartSectorList.find( t => 
        {
            if(t._smartSector.sumSectorCode === addSector._smartSector.sumSectorCode &&
               t._smartSector.sumPurchasedGroup === addSector._smartSector.sumPurchasedGroup){
                return true;
                }
         });
  
      if(smartSectorFound !== undefined)
      {
        smartSectorFound._smartSector.sumtotalImpact += addSector._smartSector.sumtotalImpact;
      }
      else
      {
        smartSectorList.push(addSector); 
      }      
    }

}

export function sortedSectorCodeList(sortTopTen:SumSmartSectorTotalParts[]): string[]{
    return sortTopTen.map((v) => {
        return v._sectorCode
    })
}

export function sortedSeriesList(sortTopTen:SumSmartSectorTotalParts[],uniqueSortedMappingGroupNoDuplicates:string[]):{name:string,data:number[]}[]{

   return  uniqueSortedMappingGroupNoDuplicates.map((v) => 
        {
            let data:number[] = [];
            let groupName: string = '';
            sortTopTen.forEach((s) => {
               s._smartSectors.forEach((l) => {
                    if(v === l._smartSector.sumPurchasedGroup){
                        data.push(l._smartSector.sumtotalImpact);
                    }
                })
            })

            if(data.length > 0){
                groupName = v;
                return {
                    name: groupName,
                    data:data
                }
            }
            else{
                return 
            }
        })
}



export function SumSmartSectorTotal(sectorList:Sector[],smartSectorList:SmartSector[],uniqueGroupIds:string[]): SumSmartSectorTotalParts[] {

    let groupInidcator:string = uniqueGroupIds[0];
    let sumSmartSectorTotalParts:SumSmartSectorTotalParts[] =[]
    

    uniqueGroupIds.forEach(
        (g, index) => 
        {
            if(groupInidcator === g)
            {    
                let smartSectorCodeIndicator:string = '';
                smartSectorList.forEach((v, index) =>
                {
                
                    if(v._smartSector.sumSectorCode !== smartSectorCodeIndicator && v._smartSector.sumPurchasedGroup === g)
                    {
                        let sumSmartSectorTotalPart = new SumSmartSectorTotalParts(v._smartSector.sumSectorCode,
                            v._smartSector.sumtotalImpact);
                            sumSmartSectorTotalPart.addSmartSectors(v);
                        sumSmartSectorTotalParts.push(sumSmartSectorTotalPart);

                            smartSectorCodeIndicator = v._smartSector.sumSectorCode;
                    }
                })
            }
            else if(groupInidcator !== g)
            {
                
                sumSmartSectorTotalParts.forEach((s, index)=>
                 {
                    let smartSector:SmartSector | undefined |null = smartSectorList.find((v, index) =>
                    {
                        if(v._smartSector.sumPurchasedGroup === g && v._smartSector.sumSectorCode === s._sectorCode)
                        {
                            return true
                        }
                        
                    })

                    if(smartSector !== undefined && smartSector !== null){
                        s._totalSectorCodeSummationImpact += smartSector._smartSector.sumtotalImpact;
                        s.addSmartSectors(smartSector)
                    }
                    else
                    {
                        s.addSmartSectors(new SmartSector({
                            sumSectorCode:s._sectorCode,
                            sumSectorName:selectSectorName(s._sectorCode, sectorList),
                            sumtotalImpact:0,
                            sumPurchasedGroup:g
                        }))

                    }

                })
            }             
        }
    )
    return sumSmartSectorTotalParts
}


export function selectSectorName(sectorId:string, sectorList:Sector[]): string {
    const sector:Sector = sectorList.find(s => {
        if (s.id === sectorId) {
            return true;
        }
    });

    return sector ? sector.name : "Direct"
}
