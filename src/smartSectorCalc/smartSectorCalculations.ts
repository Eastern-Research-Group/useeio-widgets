
import {SmartSector, SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { Sector } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from '../smartSectorWebApi.ts/webApiSmartSector';



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
    
    
    const items = smartSectorList.filter(item => item._smartSector.sumPurchasedGroup.indexOf(groupInidcator) !== -1);
    items.forEach((v, index) =>
        {
            let smartSectorCodeFirstIndicator:string = '';
            if(v._smartSector.sumSectorCode !== smartSectorCodeFirstIndicator)
            {
                let sumSmartSectorTotalPart = new SumSmartSectorTotalParts(v._smartSector.sumSectorCode,v._smartSector.sumtotalImpact);
                sumSmartSectorTotalPart.addSmartSectors(v);
                sumSmartSectorTotalParts.push(sumSmartSectorTotalPart);

                smartSectorCodeFirstIndicator = v._smartSector.sumSectorCode;
            }
        })

    uniqueGroupIds.forEach(
        (g, index) => 
        {
            if(groupInidcator !== g)
            {
                
                sumSmartSectorTotalParts.forEach((s, index)=>
                    {
                        const items = smartSectorList.filter(item => item._smartSector.sumPurchasedGroup.indexOf(g) !== -1);

                        let smartSector:SmartSector | undefined |null = items.find((v, index) =>
                        {
                            if(v._smartSector.sumPurchasedGroup === g && v._smartSector.sumSectorCode === s._sectorCode)
                            {
                                return true
                            }
                            
                        })

                        if(smartSector !== undefined && smartSector !== null)
                        {
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
                    }
                )
            }             
        }
    )
    return sumSmartSectorTotalParts
}

export function selectSectorName(sectorId:string, sectorList:Sector[]): string {
    let sector:Sector = sectorList.find(s => {
        if (s.id === sectorId) {
            return true;
        }
    });

    return sector ? sector.name : "Direct"
}

export function uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList:SectorMapping[]):string[]{
    let sortedSectorMappingByGroup:SectorMapping[] = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
          
        return a.group.localeCompare(b.group);
     });

    let sortedMappingGroupList:string[] = sortedSectorMappingByGroup.map( t => 
    {           
         return t.group;
    })
    return sortedMappingGroupList.filter((value, index) => sortedMappingGroupList.indexOf(value) === index)   
}
