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
import { Menu, MenuItem, IconButton } from "@material-ui/core";



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

export interface dataTableConfig {
    selector: string,
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
        this.piePercentContribution.init('GWP-AR6-100');
        this.piePercentContributionSectors.init('GWP-AR6-100');

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
    const [title, setTitle] = React.useState<string>('Fresh soybeans, canola, flaxseeds, and other oilseeds (BEA/NAICS 1111A0)');
    const [graph, setGraph] = React.useState<string>('GWP-AR6-100');
    const [year, setYear] = React.useState<string>('100')
    const [graphDetails, setGraphDetails] = React.useState<string>('Aggregate');
    const [aggregate, setAggregate] = React.useState<boolean>( true );
    const [detail, setDetail] = React.useState<boolean>( false );
    const [perspective, setPerspective] = React.useState<string>('final');

    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const open = Boolean(anchorEl);
  
    const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
      setAnchorEl(event.currentTarget);
    };
  
    const handleMenuClose = (type?: string) => {
        let file = null
        if(['png','svg','csv'].includes(type))
            {
                file = type
            }

      if(graphDetails === 'Aggregate')
        props.widget.piePercentContribution.addExportEventListeners(file);
        else
        props.widget.piePercentContributionSectors.addExportEventListeners(file);

      setAnchorEl(null);
    };

    let sectors = props.widget.sectors;

    if (searchTerm) {
        sectors = sectors.filter((s) => {return ((strings.search(s.name, searchTerm) >= 0)  || (strings.search(s.code, searchTerm) >= 0))});
    }

    React.useEffect(() => {
        const textElements = document.querySelectorAll<SVGTextElement>('#profile-chart-details svg text');
        
        if (textElements.length > 0) {
          textElements[textElements.length - 1].setAttribute("visibility", "hidden");
        }

        const textElement = document.querySelectorAll<SVGTextElement>('#profile-chart svg text');
        
        if (textElement.length > 0) {
          textElement[textElement.length - 1].setAttribute("visibility", "hidden");
        }

        let simple = aggregate ? 'visible' : 'hidden';
        let details = detail ? 'visible' : 'hidden';

        if (textElement.length > 0) {
            textElement[textElement.length - 1].setAttribute("visibility", simple);
          }

          if (textElements.length > 0) {
            textElements[textElements.length - 1].setAttribute("visibility", details);
          }

      }, [detail,aggregate]);

    const handleState = (e:string,c:string) => {
        setTitle( e + ' ('+ c +')')

        setSearchTerm('');
        setValue(e);
        if(graphDetails === 'Aggregate')
            props.widget.piePercentContribution.updateGraph(e,c);
        else
            props.widget.piePercentContributionSectors.updateGraph(e,c);
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
        const term = value.trimStart().toLowerCase();
        setSearchTerm(term.length === 0 ? '' : term)
    };

    const handleChange = (event:any) => {
        setGraph(event.target.value);
        setYear(new String(event.target.value).replace('GWP-AR6-',''));
        
        if(graphDetails === 'Aggregate')
            props.widget.piePercentContribution.changeGraph(event.target.value,value);
        else
            props.widget.piePercentContributionSectors.changeGraph(event.target.value,value);
    };

    const handleChangePerspective = (event:any) => {
            setPerspective(event.target.value);
            props.widget.piePercentContribution.changePerspectiveGraph(event.target.value,graph,value);
            props.widget.piePercentContributionSectors.changePerspectiveGraph(event.target.value,graph,value);
        }

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
        <div style={{
            display:'flex',
            flexDirection:'row',
            flexWrap:'wrap',
            gap: '5%'
            }}>
            <div>
                <div style={{
                display:'flex',
                flexDirection:'column',
                flexWrap:'wrap'
                }}>
                    <FormControl className={classes.margin} >
                            <TextField value={searchTerm}  label="Search Sector" variant="outlined" size="small" onChange={e => onSearch(e.target.value)} />
                            { searchTerm != null ?
                            <div className={classes.selector} id="div1">
                                <table id="sector-list-table"> 
                                <thead>
                                    <tr>
                                        <th  className={`indicator`}>BEA/NAICS<br/>Code</th>
                                        <th  className={`indicator`}>Sector Name</th>
                                    </tr>
                                </thead>
                                    <tbody id="sectorListSearch" className="sector-list-body">{rows}</tbody>
                                </table>
                                </div> : null
                            }
                    </FormControl>
                    <div style={{
                    display:'flex',
                    flexDirection:'row',
                    flexWrap:'wrap'
                    }}>
                        <FormControl className={classes.margin}>
                        <InputLabel id="demo-controlled-open-select-label">Select perspective:</InputLabel>
                        <Select
                        native
                        value={perspective}
                        onChange={handleChangePerspective}
                        label="Select perspective"
                        inputProps={{
                        name: 'perspective',
                        }}
                        >
                        <option value="final">Point of Consumption</option>
                        <option value="direct">Supply Chain</option>
                        </Select>
                        </FormControl>
                        <FormControl className={classes.margin} >
                        <InputLabel id="demo-controlled-open-select-label">Select GWP Factor:</InputLabel>
                        <Select
                        native
                        value={graph}
                        onChange={handleChange}
                        label="Select GWP Factor"
                        inputProps={{
                            name: 'graph',
                        }}
                        >
                        <option value="GWP-AR6-100">CO2e based on 100yr GWP</option>
                        <option value="GWP-AR6-20">CO2e based on 20yr GWP</option>
                        {/* <option value="Social-Cost-of-Carbon">Social Cost of Carbon</option> */}
                        </Select>
                    </FormControl>
                    <FormControl className={classes.margin} >
                        <InputLabel id="demo-controlled-open-select-label">Level of Detail:</InputLabel>
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
                        <option value="Aggregate">Simple</option>
                        <option value="Detail">Detailed</option>
                    
                        </Select>
                    </FormControl>
                    
                    </div>
                    <div
                    style={{
                        overflowWrap: 'break-word',
                        whiteSpace: 'normal',
                        wordWrap:'break-word',
                        textAlign: 'center',
                        alignContent:'center',
                        width: '300px',
                        paddingBottom:'30px',
                        marginBottom:'15px'
                        }}
                    >
                    See more info about the <a href="./sector-info-table.html" target="_blank">sectors BEA/NAICS Codes</a>.
                    </div>
                </div>
            </div>

            <div>
                <div style={{
                    display:'flex',
                    flexDirection:'column'
                    }}>
                        {
                            aggregate ? 
                            <div
                            style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                }}
                            >
                                <div>Direct and Indirect GHG Emissions</div>
                                <div
                                style={{
                                overflowWrap: 'break-word',
                                whiteSpace: 'normal',
                                fontWeight: 'bold',
                                wordWrap:'break-word',
                                textAlign: 'center'
                                }}>{title}</div>
                                <div>Based on {year}-year GWP factors (IPCC, 2021)</div>
                            </div>
                                : 
                            <div
                                 style={{
                                fontWeight: 'bold',
                                textAlign: 'center',
                                }}>
                                <div>Direct and Indirect GHG Emissions</div>
                                <div
                                style={{
                                    overflowWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    fontWeight: 'bold',
                                    wordWrap:'break-word',
                                    textAlign: 'center',
                                    }}>{title}</div>
                                <div>Based on {year}-year GWP factors (IPCC, 2021)</div>
                            </div>
                        }
                        <div style={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            width: '100%'
                        }}>
                        {/* Menu Icon Button */}
                        <IconButton onClick={handleMenuClick}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                            <path fill="none" d="M0 0h24v24H0V0z"></path>
                            <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
                            </svg>
                        </IconButton>

                        {/* Dropdown Menu */}
                        <Menu anchorEl={anchorEl} open={open} onClose={() => handleMenuClose()}>
                            <MenuItem onClick={() => handleMenuClose("svg")}>Download SVG</MenuItem>
                            <MenuItem onClick={() => handleMenuClose("png")}>Download PNG</MenuItem>
                            <MenuItem onClick={() => handleMenuClose("csv")}>Download CSV</MenuItem>
                        </Menu>
                    </div>
                    <div  style={{
                    position:'relative',
                    }}>
                            <div style={{visibility: aggregate ? 'visible' : 'hidden', position: 'absolute', marginLeft: 'auto', marginRight: 'auto' }} id="profile-chart">
                            </div>
                            <div style={{visibility: detail ? 'visible' : 'hidden', position: 'absolute', marginLeft: 'auto', marginRight: 'auto'}} id="profile-chart-details">
                            </div>
                    </div>
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
                <a style={{ cursor: "pointer" }} title={sector.code} onClick={()=> props.handleState(sector.name,sector.code)}>
                        {sector.code}
                </a>
            </td>
            <td className={classes.td}>
                <a style={{ cursor: "pointer" }} title={sector.name} onClick={()=> props.handleState(sector.name,sector.code)}>
                    {strings.cut(sector.name, 80)}
                </a>
            </td>
        </tr>        
    );
};
