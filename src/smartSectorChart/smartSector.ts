

export class SmartSector {
    _smartSector: ChartSmartSector;
    
    constructor(chartSmart?:ChartSmartSector)
    {
        this._smartSector = chartSmart;
    }
}


export class SumSmartSectorTotalParts
{
    _sectorCode:string;
    _totalSectorCodeSummationImpact?:number;
    _smartSectors:SmartSector[] = new Array<SmartSector>()

    constructor(_sectorCode:string,_totalSectorCodeSummationImpact:number)
    {
        this._sectorCode = _sectorCode;
        this._totalSectorCodeSummationImpact = _totalSectorCodeSummationImpact;
        
    }

    
    addSmartSectors(_smartSec:SmartSector) {
        this._smartSectors.push(_smartSec);
    }

}

export interface ChartSmartSector{
    sumSectorCode:string;
    sumSectorName:string;
    sumtotalImpact:number;
    sumPurchasedGroup:string;
}



export class SortingImpactPerPurchaseWithTop
{
    _sectorCode:string;
    _sectorName:string;
    _smartSectors:ImpactPerPurchaseSector[] = new Array<ImpactPerPurchaseSector>()    
    constructor(_sectorCode:string, _sectorName:string, impactPerPurchase?:ImpactPerPurchaseSector)
    {
        this._sectorCode = _sectorCode;
        this._sectorName = _sectorName;
        this._smartSectors.push(impactPerPurchase);
    }

    addSmartSectorsByCommodityGroup(_smartSectors?:ImpactPerPurchaseSector) {
        this._smartSectors.push(_smartSectors);
    }

}

export class SortingPercentContribution
{
    _sectorCode:string;
    _sectorName:string;
    _contributionList:ContributionListForSector[] = new Array<ContributionListForSector>()    
    constructor(_sectorCode:string, _sectorName:string, contribution?:ContributionListForSector)
    {
        this._sectorCode = _sectorCode;
        this._sectorName = _sectorName;
        this._contributionList.push(contribution);
    }

    addContributionSectorList(contribution?:ContributionListForSector) {
        this._contributionList.push(contribution);
    }

}

export class SortingPercentContributionIndirectAndDirect
{
    _sectorCode:string;
    _sectorName:string;
    _contributionList:ContributionListForSectorDirectOrIndirect[] = new Array<ContributionListForSectorDirectOrIndirect>()    
    constructor(_sectorCode:string, _sectorName:string, contribution?:ContributionListForSectorDirectOrIndirect)
    {
        this._sectorCode = _sectorCode;
        this._sectorName = _sectorName;
        this._contributionList.push(contribution);
    }

    addContributionSectorList(contribution?:ContributionListForSectorDirectOrIndirect) {
        this._contributionList.push(contribution);
    }

}

export interface ContributionListForSector {
   sectorPurchased:string;
   contribution:number;
}

export interface ContributionListForSectorDirectOrIndirect {
    directOrIndirect:string;
    contribution:number;
 }

export interface ImpactPerPurchaseSector{
    sectorCode:string;
    purchaseCommodity:string;
    impactPerPurchase:number;
    purchasedGroup:string;
}

export interface SortedImpactPerPurchaseTopList{
    sector_code:string;
    sector_name:string;
    topFifteenImpactPerPurchase:ImpactPerPurchaseSector[];
}