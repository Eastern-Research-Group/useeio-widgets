import * as ReactDOM from "react-dom";
import { Sector, WebModel } from "useeio";
import { SmartSectorEEIOImpactPurchasePerSector } from "./smart-sector-eeio-impact-per-purchase";
import { Widget } from "../widget";
import {
  modelOfSmartSector,
  WebModelSmartSector,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import { SmartSectorChartConfigPie } from "../totalGhgEmissionPieChart.ts/pieListSearch";
import { SmartSectorEEIOTotalImpactPerSector } from "./smart-sector-eeio-total-impacts";
import { Menu, MenuItem, IconButton } from "@material-ui/core";
import {
  fileNames,
  getLabel,
  pickPreferredBootSector,
  sectorPurchasesPointOfConsumptionOnly,
} from "../util/util";
import DownloadCSVButton from "../util/downloadcsvfile";
import { SectorSearchTable } from "../util/sectorSearchTable";
export interface SmartSectorChartConfigNormal {
  model: WebModel;
  endpoint: "./api";
  selector: ".sector-list";
}

export function smartSectorImpactPerPurchase(
  config: SmartSectorChartConfigNormal,
): SmartSectorEEIOImpactPurchasePerSector {
  return new SmartSectorEEIOImpactPurchasePerSector(config);
}

export function smartSectorTotalImpact(
  config: SmartSectorChartConfigNormal,
): SmartSectorEEIOTotalImpactPerSector {
  return new SmartSectorEEIOTotalImpactPerSector(config);
}

export class SectorListSearch extends Widget {
  /**
   * Contains the (sorted) sectors that should be displayed in this list.
   */
  sectors: Sector[];
  modelSmartSectorApi: WebModelSmartSector;
  smartSectorImpactPurchase: SmartSectorEEIOImpactPurchasePerSector;
  smartSectorTotalImpact: SmartSectorEEIOTotalImpactPerSector;

  _chartConfig: SmartSectorChartConfigNormal;

  constructor(_chartConfig: SmartSectorChartConfigPie) {
    super();
    this._chartConfig = _chartConfig.modelOne;
    this.modelSmartSectorApi = modelOfSmartSector({
      endpoint: this._chartConfig.endpoint as string,
      model: this._chartConfig.model.id() as string,
      asJsonFiles: true,
    });
    this.smartSectorImpactPurchase = smartSectorImpactPerPurchase(
      _chartConfig.modelTwo,
    );
    this.smartSectorTotalImpact = smartSectorTotalImpact(
      _chartConfig.modelThree,
    );
  }

  async update() {
    this.sectors = await this._chartConfig.model.sectors();
    this.modelSmartSectorApi.init();
    const boot = pickPreferredBootSector(this.sectors) ?? this.sectors[0];
    this.smartSectorImpactPurchase.init(
      "Acidification-Potential",
      boot.name,
      boot.code,
    );
    this.smartSectorTotalImpact.init(
      "Acidification-Potential",
      boot.name,
      boot.code,
    );
    ReactDOM.render(
      <Component widget={this} />,
      document.querySelector(this._chartConfig.selector),
    );
  }
}

const Component = (props: { widget: SectorListSearch }) => {
  const [value, setValue] = React.useState<string>("");
  const [sectorId, setSectorId] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [graph, setGraph] = React.useState<string>("");
  const [perspective, setPerspective] = React.useState<string>("final");
  const [totalImpactGraph, setTotalImpactGraph] =
    React.useState<boolean>(false);
  const [impactPerPurchaseGraph, setImpactPerPurchaseGraph] =
    React.useState<boolean>(true);
  const [changePrespective, setChangePrespective] = React.useState(
    "impact_per_purchase",
  );

  React.useEffect(() => {
    //Changes meta title according to the graph selected
    document.title = getLabel(graph);
  }, [graph]);

  React.useEffect(() => {
    const list = props.widget.sectors;
    const boot = pickPreferredBootSector(list) ?? list[0];
    setTitle(boot.name + " (" + boot.code + ")");
    setValue(boot.name);
    setSectorId(boot.id);
  }, []);

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (type?: string) => {
    let file = null;
    if (["png", "svg", "csv"].includes(type)) {
      file = type;
    }
    if (changePrespective === "impact_per_purchase") {
      props.widget.smartSectorImpactPurchase.addExportEventListeners(file);
    } else {
      props.widget.smartSectorTotalImpact.addExportEventListeners(file);
    }
    setAnchorEl(null);
  };

  const handleGraphChange = (event: any) => {
    setChangePrespective(event.target.value);

    setImpactPerPurchaseGraph(!impactPerPurchaseGraph);
    setTotalImpactGraph(!totalImpactGraph);

    const viewPerspective = sectorPurchasesPointOfConsumptionOnly(graph)
      ? "final"
      : perspective;

    if (event.target.value === "impact_per_purchase") {
      props.widget.smartSectorImpactPurchase.changeGraph(
        graph,
        value,
        viewPerspective,
      );
    } else {
      props.widget.smartSectorTotalImpact.changeGraph(
        graph,
        value,
        viewPerspective,
      );
    }
  };

  React.useEffect(() => {
    setGraph(props.widget.smartSectorImpactPurchase.getGraph());
  }, []);

  const handleState = (e: string, c: string) => {
    setTitle(e + " (" + c + ")");
    setValue(e);
    setSectorId(
      props.widget.sectors.find((t) => t.code === c)?.id ?? "",
    );

    if (changePrespective === "impact_per_purchase") {
      props.widget.smartSectorImpactPurchase.updateGraph(e, c);
    } else {
      props.widget.smartSectorTotalImpact.updateGraph(e, c);
    }
  };

  const useStyles = makeStyles((theme) => ({
    margin: {
      margin: theme.spacing(1),
      minWidth: 150,
    },
    tagCcontainer: {
      display: "flex",
      flexWrap: "wrap",
      width: "100%",
      gap: "16px",
    },
    right: {
      display: "flex",
      flexWrap: "wrap",
      flex: 1,
      boxSizing: "border-box",
    },
    left: {
      flex: 1,
      boxSizing: "border-box",
    },
    item: {
      flex: "0 0 calc(50% - 6px)",
      padding: "8px",
      boxSizing: "border-box",
    },
  }));

  const handleChange = (event: any) => {
    const newGraph = event.target.value;
    let nextPerspective = perspective;
    if (sectorPurchasesPointOfConsumptionOnly(newGraph)) {
      nextPerspective = "final";
      setPerspective("final");
    }
    setGraph(newGraph);

    if (changePrespective === "impact_per_purchase") {
      props.widget.smartSectorImpactPurchase.changeGraph(
        newGraph,
        value,
        nextPerspective,
      );
    } else {
      props.widget.smartSectorTotalImpact.changeGraph(
        newGraph,
        value,
        nextPerspective,
      );
    }
  };

  const handleChangePerspective = (event: any) => {
    const next =
      sectorPurchasesPointOfConsumptionOnly(graph)
        ? "final"
        : event.target.value;
    setPerspective(next);
    props.widget.smartSectorImpactPurchase.changePerspectiveGraph(
      next,
      graph,
      value,
    );
    props.widget.smartSectorTotalImpact.changePerspectiveGraph(
      next,
      graph,
      value,
    );
  };

  const classes = useStyles();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Update header with graph selected */}
      <h1
        id="graphTitle"
        style={{
          width: "100%",
          textAlign: "center",
          margin: "0 auto",
        }}
      >
        Contribution to Total Sector Impacts and Intensity for {getLabel(graph)}
      </h1>
      {/* Update paragraph with graph selected */}
      <p id="paragraph" className="text-center">
        For the sector selected below, the chart shows the contribution to total
        impacts and intensity from <em>Direct</em> impacts due to facility
        operations and <em>Indirect</em> impacts embedded in the purchases made
        from all other sectors for {getLabel(graph)}.
      </p>
      <div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
          }}
        >
          {totalImpactGraph ? (
            <div
              style={{
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  fontWeight: "bold",
                  wordWrap: "break-word",
                }}
              >
                {title}
              </div>
              <div>Contribution to Total Sector Impacts by Source</div>
              {/* Updated title of the graph */}
              <div>From {getLabel(graph)}</div>
            </div>
          ) : (
            <div
              style={{
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  fontWeight: "bold",
                  wordWrap: "break-word",
                }}
              >
                {title}
              </div>
              <div>Contribution to Sector Intensity by Source</div>
              {/* Updated title of the graph */}
              <div>From {getLabel(graph)}</div>
            </div>
          )}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            {/* Menu Icon Button */}
            <IconButton onClick={handleMenuClick}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
              >
                <path fill="none" d="M0 0h24v24H0V0z"></path>
                <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"></path>
              </svg>
            </IconButton>

            {/* Dropdown Menu */}
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={() => handleMenuClose()}
            >
              <MenuItem onClick={() => handleMenuClose("svg")}>
                Download SVG
              </MenuItem>
              <MenuItem onClick={() => handleMenuClose("png")}>
                Download PNG
              </MenuItem>
              <MenuItem onClick={() => handleMenuClose("csv")}>
                Download CSV
              </MenuItem>
            </Menu>
          </div>
          <div
            style={{
              display: "grid",
            }}
          >
            <div
              style={{
                visibility: totalImpactGraph ? "visible" : "hidden",
                gridColumn: "1",
                gridRow: "1",
                marginLeft: "10px",
                marginRight: "20px",
              }}
              id="total_impacts"
            ></div>
            <div
              style={{
                visibility: impactPerPurchaseGraph ? "visible" : "hidden",
                gridColumn: "1",
                gridRow: "1",
                marginLeft: "10px",
                marginRight: "20px",
              }}
              id="impact_per_purchase"
            ></div>
          </div>
        </div>
      </div>

      <div className={classes.tagCcontainer}>
        <div className={classes.left}>
          <SectorSearchTable
            sectors={props.widget.sectors}
            onPick={(sector) => handleState(sector.name, sector.code)}
          />
        </div>

        <div className={classes.right}>
          <div className={classes.item}>
            <FormControl className={classes.margin}>
              <InputLabel id="demo-controlled-open-select-label">
                Select perspective:{" "}
                <a
                  href="./glossary.html#perspectives-help"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.75rem", fontWeight: 400 }}
                >
                  What is this?
                </a>
              </InputLabel>
              <Select
                native
                value={
                  sectorPurchasesPointOfConsumptionOnly(graph)
                    ? "final"
                    : perspective
                }
                onChange={handleChangePerspective}
                label="Select perspective"
                disabled={sectorPurchasesPointOfConsumptionOnly(graph)}
                inputProps={{
                  name: "perspective",
                }}
              >
                <option value="final">Point of consumption</option>
                {!sectorPurchasesPointOfConsumptionOnly(graph) ? (
                  <option value="direct">Supply chain</option>
                ) : null}
              </Select>
            </FormControl>
          </div>

          <div className={classes.item}>
            <FormControl className={classes.margin}>
              <InputLabel id="demo-controlled-open-select-label">
                Select Indicator:
              </InputLabel>
              <Select
                native
                value={graph}
                onChange={handleChange}
                label="Select Indicator"
                inputProps={{
                  name: "graph",
                }}
              >
                {fileNames.map((file) => (
                  <option key={file} value={file}>
                    {getLabel(file)}
                  </option>
                ))}
              </Select>
            </FormControl>
          </div>
          <div className={classes.item}>
            <FormControl component="fieldset">
              <FormLabel component="legend" style={{ fontSize: "0.75rem" }}>
                Select Result View:
              </FormLabel>
              <RadioGroup
                row
                aria-label="Select Result View"
                name="impactRadio"
                value={changePrespective}
                onChange={handleGraphChange}
              >
                <FormControlLabel
                  value="total_impact"
                  control={<Radio color="default" size="small" />}
                  label="Total impacts"
                />
                <FormControlLabel
                  value="impact_per_purchase"
                  control={<Radio color="default" size="small" />}
                  label="Impact intensity"
                />
              </RadioGroup>
            </FormControl>
          </div>
          <div className={classes.item}>
            {" "}
            <DownloadCSVButton
              fileObjects={{
                filename: graph,
                perspective: perspective,
                sector: sectorId,
              }}
            />{" "}
          </div>

          <div className={`${classes.item} smart-sector-resource-links`}>
            <span className="smart-sector-resource-intro">
              See more info about the{" "}
              <a href="./sector-info-table.html" target="_blank">
                sectors BEA/NAICS Codes
              </a>
              .
            </span>
            <span className="smart-sector-resource-line">
              Open the{" "}
              <a href="./sector-dashboard.html" target="_blank">
                multi-indicator sector dashboard
              </a>{" "}
              for several indicators on one page.
            </span>
            <span className="smart-sector-resource-line">
              <a href="./glossary.html" target="_blank">
                Glossary
              </a>
              .
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

