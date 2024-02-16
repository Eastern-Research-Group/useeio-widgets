

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
    _totalSectorCodeSummationImpact:number;
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