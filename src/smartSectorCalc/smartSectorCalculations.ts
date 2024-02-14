
import {SmartSector} from '../smartSectorChart/smartSector'
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


export function selectSectorName(sectorId:string, sectorList:Sector[]): string {
    const sector:Sector = sectorList.find(s => {
        if (s.id === sectorId) {
            return true;
        }
    });

    return sector ? sector.name : "Direct"
}
