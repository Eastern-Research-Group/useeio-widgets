
import {SmartSector, SumSmartSectorTotalParts} from '../smartSectorChart/smartSector';
import { Sector } from "useeio";
import {SectorMapping} from '../smartSectorWebApi.ts/webApiSmartSector';



export function sortedSectorCodeList(sortTopTen:SumSmartSectorTotalParts[]): string[]{
    return sortTopTen.map((v) => {
        return v._sectorCode
    })
}

export function sortedSeriesList(
    sortTopTen: SumSmartSectorTotalParts[],
    uniqueSortedMappingGroupNoDuplicates: string[],
    impactSelector?: string
  ): { name: string; data: number[] }[] {
    // Create a map to hold the aggregated data
    const groupDataMap: Map<string, number[]> = new Map();
  
    // Iterate over sortTopTen once to aggregate data into the map
    sortTopTen.forEach((s) => {
      s._smartSectors.forEach((l) => {
        const groupName = l._smartSector.sumPurchasedGroup;
        const value = impactSelector === 'impact_per_purchase'
          ? l._smartSector.sumImpactPerDollar
          : l._smartSector.sumtotalImpact;
  
        if (!groupDataMap.has(groupName)) {
          groupDataMap.set(groupName, []);
        }
        groupDataMap.get(groupName)!.push(value);
      });
    });
  
    // Create the final result using the unique groups
    return uniqueSortedMappingGroupNoDuplicates.reduce((acc, groupName) => {
      const data = groupDataMap.get(groupName);
      if (data && data.length > 0) {
        acc.push({ name: groupName, data });
      }
      return acc;
    }, [] as { name: string; data: number[] }[]);
  }
  



export function SumSmartSectorTotal(
    sectorList: Sector[], 
    smartSectorList: SmartSector[], 
    uniqueGroupIds: string[], 
    impactSelector?: string
): SumSmartSectorTotalParts[] {

    let groupIndicator: string = '';
    let sumSmartSectorTotalParts: SumSmartSectorTotalParts[] = [];

    // Preprocess: Group smartSectorList by sumPurchasedGroup for faster lookups
    const groupToSmartSectors: Map<string, SmartSector[]> = new Map();

    smartSectorList.forEach(item => {
        const group = item._smartSector.sumPurchasedGroup; 
        if (!groupToSmartSectors.has(group)) {
            groupToSmartSectors.set(group, [item]);
        }
        else
            groupToSmartSectors.get(group).push(item);
    });

    // Find the first group with matching sectors
        const items = groupToSmartSectors.get('Direct');
        if (items.length > 0) {
            groupIndicator = "Direct";
            items.forEach((v) => {
                let impact = impactSelector === 'impact_per_purchase' 
                    ? v._smartSector.sumImpactPerDollar 
                    : v._smartSector.sumtotalImpact;

            
                    let sumSmartSectorTotalPart = new SumSmartSectorTotalParts(
                        v._smartSector.sumSectorCode,
                        impact,
                        v._smartSector.sumTotalRank,
                        v._smartSector.sumIntensityRank,
                        v._smartSector.sumConstructionMaterials,
                        v._smartSector.sumEnergyIntensive,
                        v._smartSector.sumModel
                    );
                    sumSmartSectorTotalPart.addSmartSectors(v);
                    sumSmartSectorTotalParts.push(sumSmartSectorTotalPart);
            });
        }

    // Now process other group IDs
    uniqueGroupIds.forEach(g => {
        if (groupIndicator !== g) {
            sumSmartSectorTotalParts.forEach(s => {
                const items = groupToSmartSectors.get(g) || [];

                let smartSector = items.find(v => v._smartSector.sumSectorCode === s._sectorCode);

                if (smartSector) {
                    let impact = impactSelector === 'impact_per_purchase'
                        ? smartSector._smartSector.sumImpactPerDollar
                        : smartSector._smartSector.sumtotalImpact;
                    
                    s._totalSectorCodeSummationImpact += impact;
                    s.addSmartSectors(smartSector);
                } else {
                    // Create a new SmartSector if none is found
                    const newSmartSector = new SmartSector({
                        sumSectorCode: s._sectorCode,
                        sumSectorName: selectSectorName(s._sectorCode, sectorList),
                        sumImpactPerDollar: impactSelector === 'impact_per_purchase' ? 0 : undefined,
                        sumtotalImpact: impactSelector !== 'impact_per_purchase' ? 0 : undefined,
                        sumPurchasedGroup: g
                    });
                    s.addSmartSectors(newSmartSector);
                }
            });
        }
    });

    return sumSmartSectorTotalParts;
}


export function selectSectorName(sectorId:string, sectorList:Sector[]): string {
    let sector:Sector = sectorList.find(s => {
        if (s.id === sectorId) {
            return true;
        }
    });

    return sector?.name
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
