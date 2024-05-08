import * as ReactDOM from "react-dom";
import { Sector, WebModel } from "useeio";
import { TextField } from "@material-ui/core";
import { SmartSectorEEIOImpactPurchasePerSector}from '../smartSectorSumOfImpcatPerPurchase.ts/smart-sector-eeio-impact-per-purchase';
import * as strings from "../util/strings";
import { Widget } from "../widget";
import {modelOfSmartSector, WebModelSmartSector } from '../smartSectorWebApi.ts/webApiSmartSector';
import React from "react";
import { makeStyles} from "@material-ui/core/styles";
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';



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
        this.modelSmartSectorApi.init();
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
    const [value, setValue] = React.useState<string>('');
    const [graph, setGraph] = React.useState<string>('');

;
    React.useEffect(() => {
        setGraph(props.widget.smartSectorImpactPurchase.getGraph())
    }, []);

    let sectors = props.widget.sectors;

    if (searchTerm) {
        sectors = sectors.filter((s) => {return ((strings.search(s.name, searchTerm) >= 0)  || (strings.search(s.code, searchTerm) >= 0))});
    }

    const handleState = (e:string) => {
        setSearchTerm(null);
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

    const onSearch = (value: string) => {
        if (!value) {
            setSearchTerm(null)
        }
        const term = value.trim().toLowerCase();
        setSearchTerm(term.length === 0 ? null : term)
    };

    const useStyles = makeStyles((theme) => ({
        margin: {
          margin: theme.spacing(1),
          minWidth: 150,
        },
        selector:{
                width: 'auto',
                height: '200px',
                border: '1px solid black',
                overflowY: 'scroll'              
        }
      }));



    const handleChange = (event:any) => {
        setGraph(event.target.value);
        props.widget.smartSectorImpactPurchase.changeGraph(event.target.value,value);
    };


const classes = useStyles();
    return (
        <div>
            <FormControl className={classes.margin} >
                        <TextField value={searchTerm}  label="Search Sector" variant="outlined" size="small" onChange={e => onSearch(e.target.value)} />
                        { searchTerm != null ?
                        <div className={classes.selector} id="div1">
                            <table id="sector-list-table"> 
                                <tbody id="sectorListSearch" className="sector-list-body">{rows}</tbody>
                            </table>
                            </div> : null
                        }
            </FormControl>
            <FormControl className={classes.margin} >
                <InputLabel id="demo-controlled-open-select-label">Select Impact:</InputLabel>
                <Select
                native
                value={graph}
                onChange={handleChange}
                label="Select Impact:"
                inputProps={{
                    name: 'graph',
                }}
                >
                <option value="GWP-AR6-20">20yr GWP</option>
                <option value="GWP-AR6-100">100yr GWP</option>
                <option value="Social-Cost-of-Carbon">Social Cost of Carbon</option>
                </Select>
            </FormControl>
      </div>
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
                <a style={{ cursor: "pointer" }} title={sector.code} onClick={()=> props.handleState(sector.name)}>
                        {sector.code}
                </a>
            </td>
            <td className={classes.td}>
                <a style={{ cursor: "pointer" }} title={sector.name} onClick={()=> props.handleState(sector.name)}>
                    {strings.cut(sector.name, 80)}
                </a>
            </td>
        </tr>        
    );
};
