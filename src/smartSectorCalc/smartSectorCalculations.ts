
import {SmartSector, SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { Sector } from "useeio";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from '../smartSectorWebApi.ts/webApiSmartSector';



export function sortedSectorCodeList(sortTopTen:SumSmartSectorTotalParts[]): string[]{
    return sortTopTen.map((v) => {
        return v._sectorCode
    })
}

export function sortedSeriesList(sortTopTen:SumSmartSectorTotalParts[],uniqueSortedMappingGroupNoDuplicates:string[],impactSelector?:string):{name:string,data:number[]}[]{

   return  uniqueSortedMappingGroupNoDuplicates.map((v) => 
        {
            let data:number[] = [];
            let groupName: string = '';
            sortTopTen.forEach((s) => {
               s._smartSectors.forEach((l) => {
                    if(v === l._smartSector.sumPurchasedGroup){
                        if (impactSelector == 'impact_per_dollar')
                            {
                                data.push(l._smartSector.sumImpactPerDollar);
                            }
                            else
                            {
                                data.push(l._smartSector.sumtotalImpact);
                            }
                        
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



export function SumSmartSectorTotal(sectorList:Sector[],smartSectorList:SmartSector[],uniqueGroupIds:string[],impactSelector?:string): SumSmartSectorTotalParts[] {

    let groupInidcator:string = '';
    let sumSmartSectorTotalParts:SumSmartSectorTotalParts[] =[]
    
    
    let items:SmartSector[] = []

    uniqueGroupIds.every(t => {

         items = smartSectorList.filter(item => item._smartSector.sumPurchasedGroup.indexOf(t) !== -1);

         if(items !== undefined || items !== null || items.length > 0)
         {
            groupInidcator = t;
            return true;
         }

    })

    items.forEach((v, index) =>
        {
            let impact 
            if (impactSelector == 'impact_per_dollar')
            {
                impact = v._smartSector.sumImpactPerDollar
            }
            else
            {
                impact = v._smartSector.sumtotalImpact
            }

            let smartSectorCodeFirstIndicator:string = '';
            if(v._smartSector.sumSectorCode !== smartSectorCodeFirstIndicator)
            {
                let sumSmartSectorTotalPart = new SumSmartSectorTotalParts(v._smartSector.sumSectorCode,impact);
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
                            if (impactSelector == 'impact_per_dollar')
                                {
                                    s._totalSectorCodeSummationImpact += smartSector._smartSector.sumImpactPerDollar;
                                }
                                else
                                {
                                    s._totalSectorCodeSummationImpact += smartSector._smartSector.sumtotalImpact;
                                }
                            s.addSmartSectors(smartSector)
                        }
                        else
                        {
                            if (impactSelector == 'impact_per_dollar')
                                {
                                    s.addSmartSectors(new SmartSector({
                                        sumSectorCode:s._sectorCode,
                                        sumSectorName:selectSectorName(s._sectorCode, sectorList),
                                        sumImpactPerDollar:0,
                                        sumPurchasedGroup:g
                                    }))                                }
                                else
                                {
                                    s.addSmartSectors(new SmartSector({
                                        sumSectorCode:s._sectorCode,
                                        sumSectorName:selectSectorName(s._sectorCode, sectorList),
                                        sumtotalImpact:0,
                                        sumPurchasedGroup:g
                                    }))                                }
                           

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

export function uniqueSortedMappingGroupNoDuplicatesList(sectorMappingList:SectorMapping[], groupSelection?:string ):string[]{
    
    let sortedSectorMappingByGroup:SectorMapping[];
    let sortedMappingGroupList:string[];

    if(groupSelection === 'group_summary')
    {
        sortedSectorMappingByGroup = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
          
            return a.group_summary.localeCompare(b.group_summary);
         });
    
        sortedMappingGroupList = sortedSectorMappingByGroup.map( t => 
        {           
             return t.group_summary;
        })
    }
    else
    {
        sortedSectorMappingByGroup = sectorMappingList.sort((a: SectorMapping, b: SectorMapping): any => {
          
            return a.group_detail.localeCompare(b.group_detail);
         });
    
        sortedMappingGroupList = sortedSectorMappingByGroup.map( t => 
        {           
             return t.group_detail;
        })
    }
    
    
    return sortedMappingGroupList.filter((value, index) => sortedMappingGroupList.indexOf(value) === index)   
}
