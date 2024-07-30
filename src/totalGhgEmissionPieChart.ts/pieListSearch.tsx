import * as ReactDOM from "react-dom";
import { Sector, WebModel } from "useeio";
import { TextField } from "@material-ui/core";
import { PiePercentContribution }from './piePercentContribution'
import { PiePercentContributionDirectAndIndirect } from "./piePercentContributionDirectAndIndirect";
import * as strings from "../util/strings";
import { Widget } from "../widget";
import {modelOfSmartSector, WebModelSmartSector } from '../smartSectorWebApi.ts/webApiSmartSector';
import React from "react";
import { makeStyles} from "@material-ui/core/styles";
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Select from '@material-ui/core/Select';



export interface SmartSectorChartConfigPie {modelOne:{
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
},modelTwo:{
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
},
modelThree:{
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
}}

export interface SmartSectorChartConfigNormal {
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
}

export function piePercentContributionList(config: SmartSectorChartConfigNormal): PiePercentContributionDirectAndIndirect {
    return new PiePercentContributionDirectAndIndirect(config);
}

export function piePercentContributionListSectors(config: SmartSectorChartConfigNormal): PiePercentContribution {
    return new PiePercentContribution(config);
}

export class PieListSearch extends Widget {

    /**
     * Contains the (sorted) sectors that should be displayed in this list.
     */
    sectors: Sector[];
    modelSmartSectorApi:WebModelSmartSector;
    piePercentContribution:PiePercentContributionDirectAndIndirect;
    piePercentContributionSectors:PiePercentContribution;

    _chartConfig: SmartSectorChartConfigNormal;

    constructor(_chartConfig: SmartSectorChartConfigPie) {
        super();
        this._chartConfig = _chartConfig.modelOne;
        this.modelSmartSectorApi = modelOfSmartSector({
            endpoint: this._chartConfig.endpoint as string,
            model: this._chartConfig.model.id() as string,
            asJsonFiles: true
    })
    this.piePercentContribution = piePercentContributionList(_chartConfig.modelTwo)
    this.piePercentContributionSectors = piePercentContributionListSectors(_chartConfig.modelThree)

    }

    async update() {
        this.modelSmartSectorApi.init();
        this.piePercentContribution.init('GWP-AR6-20');
        this.piePercentContributionSectors.init('GWP-AR6-20');

        this.sectors = await this._chartConfig.model.sectors();
        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this._chartConfig.selector),
        );
    }

}


const Component = (props: { widget: PieListSearch }) => {

    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [value, setValue] = React.useState<string>('');
    const [graph, setGraph] = React.useState<string>('GWP-AR6-100');
    const [graphDetails, setGraphDetails] = React.useState<string>('Aggregate');
    const [aggregate, setAggregate] = React.useState<boolean>( true );
    const [detail, setDetail] = React.useState<boolean>( false );




    let sectors = props.widget.sectors;

    if (searchTerm) {
        sectors = sectors.filter((s) => {return ((strings.search(s.name, searchTerm) >= 0)  || (strings.search(s.code, searchTerm) >= 0))});
    }

    const handleState = (e:string) => {
        setSearchTerm('');
        setValue(e);
        if(graphDetails === 'Aggregate')
            props.widget.piePercentContribution.updateGraph(e);
        else
            props.widget.piePercentContributionSectors.updateGraph(e);
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
            setSearchTerm('')
        }
        const term = value.trim().toLowerCase();
        setSearchTerm(term.length === 0 ? '' : term)
    };

    const handleChange = (event:any) => {
        setGraph(event.target.value);
        
       if(graphDetails === 'Aggregate')
        {
        props.widget.piePercentContribution.changeGraph(event.target.value,value);
       }
       else
            props.widget.piePercentContributionSectors.changeGraph(event.target.value,value);
    };

    const handleChangeGraphDetail = (event:any) => {
        setGraphDetails(event.target.value);
        if(event.target.value === 'Aggregate')
        {
            setAggregate(true)
            setDetail(false)
            props.widget.piePercentContribution.changeGraph(graph,value);

        }
        else
        {
            setAggregate(false)
            setDetail(true)
            props.widget.piePercentContributionSectors.changeGraph(graph,value);

        }
    };

    let useStyles = makeStyles((theme) => ({
        margin: {
          margin: theme.spacing(1),
          minWidth: 150,
        },
        selector:{
                width: 'auto',
                height: '200px',
                border: '1px solid black',
                overflowY: 'scroll'              
        },
      }));



    let classes = useStyles();
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
                <InputLabel id="demo-controlled-open-select-label">Select Metric (GWP or SCC):</InputLabel>
                <Select
                native
                value={graph}
                onChange={handleChange}
                label="Select Metric (GWP or SCC)"
                inputProps={{
                    name: 'graph',
                }}
                >
                <option value="GWP-AR6-20">20yr GWP</option>
                <option value="GWP-AR6-100">100yr GWP</option>
                <option value="Social-Cost-of-Carbon">Social Cost of Carbon</option>
                </Select>
            </FormControl>
            <FormControl className={classes.margin} >
                <InputLabel id="demo-controlled-open-select-label">Sector Grouping</InputLabel>
                <Select
                id="aggregateId"
                native
                value={graphDetails}
                onChange={handleChangeGraphDetail}
                label="Detail or Aggregate"
                inputProps={{
                    name: 'details',
                }}
                >
                <option value="Aggregate">Direct vs Indirect</option>
                <option value="Detail">Detailed</option>
               
                </Select>
            </FormControl>
            <div  style={{
            position:'relative'
            }}>
                    <div style={{visibility: aggregate ? 'visible' : 'hidden', position: 'absolute', marginLeft: 'auto', marginRight: 'auto' }} id="profile-chart">
                    </div>
                    <div style={{visibility: detail ? 'visible' : 'hidden', position: 'absolute', marginLeft: 'auto', marginRight: 'auto'}} id="profile-chart-details">
                    </div>
            </div>
      </div>
    );
};

export type RowProps = {
    sector: Sector;
    widget: PieListSearch;
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
