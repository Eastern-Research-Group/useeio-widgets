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
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import { withStyles } from '@material-ui/core/styles';
import { SmartSectorChartConfigPie } from "../totalGhgEmissionPieChart.ts/pieListSearch";
import { SmartSectorEEIOTotalImpactPerSector}from '../smartSectorSumOfImpcatPerPurchase.ts/smart-sector-eeio-total-impacts';




export interface SmartSectorChartConfigNormal {
    model: WebModel,
    endpoint: './api',
    selector: '.sector-list',
}

export function smartSectorImpactPerPurchase(config: SmartSectorChartConfigNormal): SmartSectorEEIOImpactPurchasePerSector {
    return new SmartSectorEEIOImpactPurchasePerSector(config);
}

export function smartSectorTotalImpact(config: SmartSectorChartConfigNormal): SmartSectorEEIOTotalImpactPerSector {
    return new SmartSectorEEIOTotalImpactPerSector(config);
}

export class SectorListSearch extends Widget {

    /**
     * Contains the (sorted) sectors that should be displayed in this list.
     */
    sectors: Sector[];
    modelSmartSectorApi:WebModelSmartSector;
    smartSectorImpactPurchase:SmartSectorEEIOImpactPurchasePerSector;
    smartSectorTotalImpact:SmartSectorEEIOTotalImpactPerSector;

    _chartConfig: SmartSectorChartConfigNormal;

    constructor(_chartConfig: SmartSectorChartConfigPie) {
        super();
        this._chartConfig = _chartConfig.modelOne;
        this.modelSmartSectorApi = modelOfSmartSector({
            endpoint: this._chartConfig.endpoint as string,
            model: this._chartConfig.model.id() as string,
            asJsonFiles: true
    })
    this.smartSectorImpactPurchase = smartSectorImpactPerPurchase(_chartConfig.modelTwo)
    this.smartSectorTotalImpact = smartSectorTotalImpact(_chartConfig.modelThree)

    }

    async update() {
        this.modelSmartSectorApi.init();
        this.smartSectorImpactPurchase.init('GWP-AR6-100');
        this.smartSectorTotalImpact.init('GWP-AR6-100');
        this.sectors = await this._chartConfig.model.sectors();
        ReactDOM.render(
            <Component widget={this} />,
            document.querySelector(this._chartConfig.selector),
        );
    }

}


const Component = (props: { widget: SectorListSearch }) => {



    const [searchTerm, setSearchTerm] = React.useState<string>('');
    const [value, setValue] = React.useState<string>('');
    const [title, setTitle] = React.useState<string>('1111A0 - Fresh soybeans, canola, flaxseeds, and other oilseeds');
    const [graph, setGraph] = React.useState<string>('');
    const [totalImpactGraph, setTotalImpactGraph] = React.useState<boolean>( false );
    const [impactPerPurchaseGraph, setImpactPerPurchaseGraph] = React.useState<boolean>( true );
    const [changePrespective, setChangePrespective] = React.useState('impact_per_purchase');

    const handleGraphChange = (event:any) => {
      setChangePrespective(event.target.value);

      setImpactPerPurchaseGraph(!impactPerPurchaseGraph)
      setTotalImpactGraph(!totalImpactGraph)

        if(event.target.value === 'impact_per_purchase')
        {
            props.widget.smartSectorImpactPurchase.changeGraph(graph,value);
        }
        else
        {
            props.widget.smartSectorTotalImpact.changeGraph(graph,value);
        }
    };

    React.useEffect(() => {
        setGraph(props.widget.smartSectorImpactPurchase.getGraph())
    }, []);

    let sectors = props.widget.sectors;

    if (searchTerm) {
        sectors = sectors.filter((s) => {return ((strings.search(s.name, searchTerm) >= 0)  || (strings.search(s.code, searchTerm) >= 0))});
    }

    const handleState = (e:string,c:string) => {
        setTitle( c + " - " + e)
        setSearchTerm('');
        setValue(e);

        if( changePrespective === 'impact_per_purchase')
            {
                props.widget.smartSectorImpactPurchase.updateGraph(e);
            }
        else
            {
                props.widget.smartSectorTotalImpact.updateGraph(e);
            }      
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

        if( changePrespective === 'impact_per_purchase')
            {
                props.widget.smartSectorImpactPurchase.changeGraph(event.target.value,value);
            }
        else
            {
                props.widget.smartSectorTotalImpact.changeGraph(event.target.value,value);
            }    
        };


const classes = useStyles();
    return (
        <div style={{
            display:'flex',
              flexDirection:'column'
            }}>
            <div>
                <div style={{
                    display:'flex',
                    flexDirection:'column'
                    }}>
                        <div style={{
                            overflowWrap: 'break-word',
                            whiteSpace: 'normal',
                            fontWeight: 'bold',
                            wordWrap:'break-word',
                            textAlign: 'center',
                            }}>
                                {title} ({graph})
                        </div>
                        <div  style={{
                    display: 'grid'
                    }}>
                                <div style={{visibility: totalImpactGraph ? 'visible' : 'hidden', gridColumn: '1',
  gridRow: '1', marginLeft: '10px', marginRight: '20px' }} id="total_impacts">
                                </div>
                                <div style={{visibility: impactPerPurchaseGraph ? 'visible' : 'hidden', gridColumn: '1',
  gridRow: '1', marginLeft: '10px', marginRight: '20px'}} id="impact_per_purchase">
                                </div>
                        </div>
                </div>
            </div>

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
                    <option value="GWP-AR6-100">100yr GWP</option>
                    <option value="GWP-AR6-20">20yr GWP</option>
                    <option value="Social-Cost-of-Carbon">Social Cost of Carbon</option>
                    </Select>
                </FormControl>

                <FormControl component="fieldset">
                <FormLabel component="legend">Select Result View:</FormLabel>
                <RadioGroup row aria-label="Select Result View" name="impactRadio" value={changePrespective} onChange={handleGraphChange}>
                    <FormControlLabel value="total_impact" control={<Radio color="default" size="small" />} label="Total Emissions" />
                    <FormControlLabel value="impact_per_purchase" control={<Radio color="default" size="small"  />} label="Emission Intensity" />
                </RadioGroup>
                </FormControl>
            </div>
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
