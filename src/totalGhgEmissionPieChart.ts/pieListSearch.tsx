import * as ReactDOM from "react-dom";
import { Sector, WebModel } from "useeio";
import { PiePercentContribution } from "./piePercentContribution";
import { PiePercentContributionDirectAndIndirect } from "./piePercentContributionDirectAndIndirect";
import { Widget } from "../widget";
import {
  filterPickableSectors,
  pickPreferredBootSector,
} from "../util/util";
import {
  modelOfSmartSector,
  WebModelSmartSector,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import DownloadCSVButton from "../util/downloadcsvfile";
import { ChartExportMenu } from "../util/chartExportMenu";
import { isChartExportAttributionSvgText } from "../util/chartExportOverlay";
import {
  getLabel,
  sectorPurchasesPointOfConsumptionOnly,
} from "../util/util";
import { IndicatorOptGroups } from "../util/indicatorOptGroups";
import { SectorSearchTable } from "../util/sectorSearchTable";

export interface SmartSectorChartConfigPie {
  modelOne: {
    model: WebModel;
    endpoint: "./api";
    selector: ".sector-list";
  };
  modelTwo: {
    model: WebModel;
    endpoint: "./api";
    selector: ".sector-list";
  };
  modelThree: {
    model: WebModel;
    endpoint: "./api";
    selector: ".sector-list";
  };
}

export interface SmartSectorChartConfigNormal {
  model: WebModel;
  endpoint: "./api";
  selector: ".sector-list";
}

export interface dataTableConfig {
  selector: string;
}

export function piePercentContributionList(
  config: SmartSectorChartConfigNormal,
): PiePercentContributionDirectAndIndirect {
  return new PiePercentContributionDirectAndIndirect(config);
}

export function piePercentContributionListSectors(
  config: SmartSectorChartConfigNormal,
): PiePercentContribution {
  return new PiePercentContribution(config);
}

export class PieListSearch extends Widget {
  /**
   * Contains the (sorted) sectors that should be displayed in this list.
   */
  sectors: Sector[];
  modelSmartSectorApi: WebModelSmartSector;
  piePercentContribution: PiePercentContributionDirectAndIndirect;
  piePercentContributionSectors: PiePercentContribution;

  _chartConfig: SmartSectorChartConfigNormal;

  constructor(_chartConfig: SmartSectorChartConfigPie) {
    super();
    this._chartConfig = _chartConfig.modelOne;
    this.modelSmartSectorApi = modelOfSmartSector({
      endpoint: this._chartConfig.endpoint as string,
      model: this._chartConfig.model.id() as string,
      asJsonFiles: true,
    });
    this.piePercentContribution = piePercentContributionList(
      _chartConfig.modelTwo,
    );
    this.piePercentContributionSectors = piePercentContributionListSectors(
      _chartConfig.modelThree,
    );
  }

  async update() {
    this.sectors = filterPickableSectors(
      await this._chartConfig.model.sectors(),
    );
    this.modelSmartSectorApi.init();
    const boot = pickPreferredBootSector(this.sectors) ?? this.sectors[0];
    ReactDOM.render(
      <Component widget={this} />,
      document.querySelector(this._chartConfig.selector),
    );
    await Promise.all([
      this.piePercentContribution.init(
        "Acidification-Potential",
        boot.name,
        boot.code,
      ),
      this.piePercentContributionSectors.init(
        "Acidification-Potential",
        boot.name,
        boot.code,
      ),
    ]);
  }
}

const Component = (props: { widget: PieListSearch }) => {
  const [value, setValue] = React.useState<string>("");
  const [sectorId, setSectorId] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [graph, setGraph] = React.useState<string>("Acidification-Potential");
  const [year, setYear] = React.useState<string>("100");
  const [graphDetails, setGraphDetails] = React.useState<string>("Aggregate");
  const [aggregate, setAggregate] = React.useState<boolean>(true);
  const [detail, setDetail] = React.useState<boolean>(false);
  const [perspective, setPerspective] = React.useState<string>("final");

  const handleChartExport = (type: "png" | "svg" | "csv") => {
    if (graphDetails === "Aggregate") {
      props.widget.piePercentContribution.addExportEventListeners(type);
    } else {
      props.widget.piePercentContributionSectors.addExportEventListeners(type);
    }
  };

  React.useEffect(() => {
    const list = props.widget.sectors;
    const boot = pickPreferredBootSector(list) ?? list[0];
    setTitle(boot.name + " (" + boot.code + ")");
    setValue(boot.name);
    setSectorId(boot.id);
  }, []);

  React.useEffect(() => {
    const setCenterTotalVisibility = (
      selector: string,
      visibility: string,
    ) => {
      const texts = document.querySelectorAll<SVGTextElement>(
        `${selector} svg text`,
      );
      for (let i = texts.length - 1; i >= 0; i--) {
        const node = texts[i];
        if (isChartExportAttributionSvgText(node.textContent)) {
          continue;
        }
        node.setAttribute("visibility", visibility);
        return;
      }
    };

    setCenterTotalVisibility("#profile-chart", aggregate ? "visible" : "hidden");
    setCenterTotalVisibility(
      "#profile-chart-details",
      detail ? "visible" : "hidden",
    );
  }, [detail, aggregate]);

  const handleState = (e: string, c: string) => {
    setTitle(e + " (" + c + ")");
    setValue(e);
    setSectorId(
      props.widget.sectors.find((t) => t.code === c)?.id ?? "",
    );
    if (graphDetails === "Aggregate")
      props.widget.piePercentContribution.updateGraph(e, c);
    else props.widget.piePercentContributionSectors.updateGraph(e, c);
  };

  const handleChange = async (event: any) => {
    const newGraph = event.target.value;
    const forceFinal = sectorPurchasesPointOfConsumptionOnly(newGraph);
    if (forceFinal) {
      setPerspective("final");
    }
    setGraph(newGraph);
    setYear(new String(event.target.value).replace("GWP-AR6-", ""));
    if (graphDetails === "Aggregate") {
      if (forceFinal) {
        await props.widget.piePercentContribution.changePerspectiveGraph(
          "final",
          newGraph,
          value,
        );
      }
      await props.widget.piePercentContribution.changeGraph(newGraph, value);
    } else {
      if (forceFinal) {
        await props.widget.piePercentContributionSectors.changePerspectiveGraph(
          "final",
          newGraph,
          value,
        );
      }
      await props.widget.piePercentContributionSectors.changeGraph(
        newGraph,
        value,
      );
    }
  };

  React.useEffect(() => {
    //Changes meta title according to the graph selected
    document.title = getLabel(graph);
  }, [graph]);

  const handleChangePerspective = (event: any) => {
    const next = sectorPurchasesPointOfConsumptionOnly(graph)
      ? "final"
      : event.target.value;
    setPerspective(next);
    props.widget.piePercentContribution.changePerspectiveGraph(
      next,
      graph,
      value,
    );
    props.widget.piePercentContributionSectors.changePerspectiveGraph(
      next,
      graph,
      value,
    );
  };

  const handleChangeGraphDetail = (event: any) => {
    setGraphDetails(event.target.value);
    if (event.target.value === "Aggregate") {
      setAggregate(true);
      setDetail(false);
      props.widget.piePercentContribution.changeGraph(graph, value);
    } else {
      setAggregate(false);
      setDetail(true);
      props.widget.piePercentContributionSectors.changeGraph(graph, value);
    }
  };

  const useStyles = makeStyles((theme) => ({
    margin: {
      margin: theme.spacing(1),
      minWidth: 150,
    },
    flexContainer: {
      display: "flex",
      flexDirection: "row",
      flexWrap: "wrap",
      "@media (max-width:1256px)": {
        flexDirection: "column",
      },
    },
    linkSectors: {
      overflowWrap: "break-word",
      whiteSpace: "normal",
      wordWrap: "break-word",
      marginBottom: "1em",
      flex: "1 1 220px",
      minWidth: 200,
      maxWidth: "28rem",
      "@media (max-width:1256px)": {
        bottom: "0",
        right: "0",
      },
    },
  }));

  const classes = useStyles();
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        gap: "5%",
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
        Comparison of Direct and Indirect Supply Chain Impacts for{" "}
        {getLabel(graph)}
      </h1>
      {/* Update paragraph with graph selected */}
      <p id="paragraph" className="text-center">
        For the sector selected below, the chart shows the total and percentage
        impacts attributable to <em>Direct</em> impacts from facility operations
        and <em>Indirect</em> impacts embedded in the purchases made by the
        sector for {getLabel(graph)}.
      </p>
      <div className={classes.flexContainer}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
            width: "50%",
          }}
        >
          <SectorSearchTable
            sectors={props.widget.sectors}
            onPick={(sector) => handleState(sector.name, sector.code)}
          />
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
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
                <IndicatorOptGroups />
              </Select>
            </FormControl>
            <FormControl className={classes.margin}>
              <InputLabel id="demo-controlled-open-select-label">
                Level of Detail:
              </InputLabel>
              <Select
                id="aggregateId"
                native
                value={graphDetails}
                onChange={handleChangeGraphDetail}
                label="Detail or Aggregate"
                inputProps={{
                  name: "details",
                }}
              >
                <option value="Aggregate">Simple</option>
                <option value="Detail">Detailed</option>
              </Select>
            </FormControl>
            <div>
              {" "}
              <DownloadCSVButton
                fileObjects={{
                  filename: graph,
                  perspective: perspective,
                  sector: sectorId,
                }}
              />{" "}
            </div>
          </div>
          <div className={`${classes.linkSectors} smart-sector-resource-links`}>
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

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flexWrap: "wrap",
          }}
        >
          {aggregate ? (
            <div
              style={{
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {/* Updated title of the graph with selected option */}
              <div>
                Direct and Indirect Supply Chain Impacts for {getLabel(graph)}
              </div>
              <div
                style={{
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  fontWeight: "bold",
                  wordWrap: "break-word",
                  textAlign: "center",
                }}
              >
                {title}
              </div>
            </div>
          ) : (
            <div
              style={{
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              {/* Updated title of the graph with selected option */}
              <div>
                Direct and Indirect Supply Chain Impacts for {getLabel(graph)}
              </div>
              <div
                style={{
                  overflowWrap: "break-word",
                  whiteSpace: "normal",
                  fontWeight: "bold",
                  wordWrap: "break-word",
                  textAlign: "center",
                }}
              >
                {title}
              </div>
            </div>
          )}
          <ChartExportMenu onExport={handleChartExport} />
          <div
            style={{
              position: "relative",
            }}
          >
            <div
              style={{
                visibility: aggregate ? "visible" : "hidden",
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
              }}
              id="profile-chart"
            ></div>
            <div
              style={{
                visibility: detail ? "visible" : "hidden",
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
              }}
              id="profile-chart-details"
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

