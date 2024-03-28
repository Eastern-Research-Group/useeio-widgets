import { Card, CardContent, Grid, makeStyles, Paper, Tab, TablePagination, Tabs, Typography } from "@material-ui/core";
import * as ReactDOM from "react-dom";
import { Indicator, Matrix, NaicsMap, Sector, WebModel } from "useeio";
import { TextField } from "@material-ui/core";
import { SmartSectorEEIOImpactPurchasePerSector}from '../smartSectorSumOfImpcatPerPurchase.ts/smart-sector-eeio-impact-per-purchase';
import * as strings from "../util/strings";
import { Widget } from "../widget";
import {modelOfSmartSector, WebModelSmartSector, SectorMapping, SectorContributionToImpact, ImpactOutput } from '../smartSectorWebApi.ts/webApiSmartSector';




export interface SmartSectorChartConfigModels {modelOne:{
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
},modelTwo:{
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
}}

export interface SmartSectorChartConfigNormal {
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
}

export function smartSectorImpactPerPurchase(config: SmartSectorChartConfigNormal): SmartSectorEEIOImpactPurchasePerSector {
    return new SmartSectorEEIOImpactPurchasePerSector(config);
}

export class SectorListSearch extends Widget {

    /**
     * Contains the (sorted) sectors that should be displayed in this list.
     */
    sectors: Sector[];
    modelSmartSectorApi:WebModelSmartSector;
    smartSectorImpactPurchase:SmartSectorEEIOImpactPurchasePerSector;
    _chartConfig: SmartSectorChartConfigNormal;

    constructor(_chartConfig: SmartSectorChartConfigModels) {
        super();
        this._chartConfig = _chartConfig.modelOne;
        this.modelSmartSectorApi = modelOfSmartSector({
            endpoint: this._chartConfig.endpoint as string,
            model: this._chartConfig.model.id() as string,
            asJsonFiles: true
    })
    this.smartSectorImpactPurchase = smartSectorImpactPerPurchase(_chartConfig.modelTwo)
    }

    async update() {
        this.smartSectorImpactPurchase.init('GWP-AR6-20');
        this.sectors = await this._chartConfig.model.sectors();
        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this._chartConfig.selector),
        );
    }

}

const Component = (props: { widget: SectorListSearch }) => {


    const [searchTerm, setSearchTerm] = React.useState<string | null>(null);
    const [value, setValue] = React.useState<string>();

    let sectors = props.widget.sectors;

    console.log(searchTerm + 'searchTerm')
    if (searchTerm) {
        sectors = sectors.filter((s) => strings.search(s.name, searchTerm) >= 0);
    }

    const handleState = (e:string) => {
        setSearchTerm(e);
        setValue(e);
        props.widget.smartSectorImpactPurchase.updateGraph(e);
    };

    // create the sector ranking, if there is a result
    let ranking: [Sector][];
    ranking = sectors.map((sector) => {
            return [sector];
        });

    const rows: JSX.Element[] = ranking.map(([sector], i) => (
        <Row
            key={sector.code}
            sector={sector}
            widget={props.widget}
            index={i}
            handleState = {handleState}
        />
    ));
    let marginTop = 0;

    const onSearch = (value: string) => {
        if (!value) {
            setSearchTerm(null)
        }
        const term = value.trim().toLowerCase();
        setSearchTerm(term.length === 0 ? null : term)
    };

    return (
        <>
            <div style={{ marginTop: marginTop }}>
            <form  noValidate autoComplete="off">
            <TextField value={searchTerm} id="outlined-basic" label="Search" variant="outlined" size="small" onChange={e => onSearch(e.target.value)} />
            </form>
                { searchTerm != null ? <div className="sector-list-table">
                    
                <table id="sectorListSearch" className="sector-list-body">{rows}</table>
                </div>: null }
            </div>
        </>
    );
};

export type RowProps = {
    sector: Sector;
    widget: SectorListSearch;
    index: number;
    handleState: any;
};

const Row = (props: RowProps) => {
    const sector = props.sector;

    const useStyles = makeStyles({
        td: {
            borderTop: "lightgray solid 1px",
            padding: "5px 0px",
            whiteSpace: "nowrap",
            fontSize: 12
        }
    });
    const classes = useStyles();

    return (
    
        <tr>
            <td
                key={props.sector.code}
                className={classes.td}
            >
            </td>
            <td className={classes.td}>
                <a style={{ cursor: "pointer" }} title={sector.name} onClick={()=> props.handleState(sector.name)}>
                    {strings.cut(sector.name, 80)}
                </a>
            </td>
        </tr>        
    );
};
