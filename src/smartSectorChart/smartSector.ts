

export class SmartSector {
    _smartSector: ChartSmartSector;
    
    constructor(chartSmart:ChartSmartSector)
    {
        this._smartSector = chartSmart;
    }

}

export interface ChartSmartSector{
    sumSectorCode:string;
    sumSectorName:string;
    sumtotalImpact:number;
    sumPurchasedGroup:string;
}