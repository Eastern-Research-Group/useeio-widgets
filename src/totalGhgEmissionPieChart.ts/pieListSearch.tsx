import * as ReactDOM from "react-dom";
import { Sector, WebModel } from "useeio";
import { TextField } from "@material-ui/core";
import { PiePercentContribution } from "./piePercentContribution";
import { PiePercentContributionDirectAndIndirect } from "./piePercentContributionDirectAndIndirect";
import * as strings from "../util/strings";
import { Widget } from "../widget";
import { fileNames } from "../util/util";
import {
  modelOfSmartSector,
  WebModelSmartSector,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import { Menu, MenuItem, IconButton } from "@material-ui/core";
import DownloadCSVButton from "../util/downloadcsvfile";
import { getLabel } from "../util/util";

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
    this.sectors = await this._chartConfig.model.sectors();
    this.modelSmartSectorApi.init();
    this.piePercentContribution.init(
      "Acidification-Potential",
      this.sectors[0].name,
    );
    this.piePercentContributionSectors.init(
      "Acidification-Potential",
      this.sectors[0].name,
    );
    ReactDOM.render(
      <Component widget={this} />,
      document.querySelector(this._chartConfig.selector),
    );
  }
}

const Component = (props: { widget: PieListSearch }) => {
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [value, setValue] = React.useState<string>("");
  const [sectorId, setSectorId] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [graph, setGraph] = React.useState<string>("Acidification-Potential");
  const [year, setYear] = React.useState<string>("100");
  const [graphDetails, setGraphDetails] = React.useState<string>("Aggregate");
  const [aggregate, setAggregate] = React.useState<boolean>(true);
  const [detail, setDetail] = React.useState<boolean>(false);
  const [perspective, setPerspective] = React.useState<string>("final");

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

    if (graphDetails === "Aggregate")
      props.widget.piePercentContribution.addExportEventListeners(file);
    else
      props.widget.piePercentContributionSectors.addExportEventListeners(file);

    setAnchorEl(null);
  };

  let sectors = props.widget.sectors;

  if (searchTerm) {
    sectors = sectors.filter((s) => {
      return (
        strings.search(s.name, searchTerm) >= 0 ||
        strings.search(s.code, searchTerm) >= 0
      );
    });
  }

  React.useEffect(() => {
    setTitle(sectors[0].name + " (" + sectors[0].code + ")");
    setValue(sectors[0].name);
    setSectorId(sectors[0].id);
  }, []);

  React.useEffect(() => {
    const textElements = document.querySelectorAll<SVGTextElement>(
      "#profile-chart-details svg text",
    );

    if (textElements.length > 0) {
      textElements[textElements.length - 1].setAttribute(
        "visibility",
        "hidden",
      );
    }

    const textElement = document.querySelectorAll<SVGTextElement>(
      "#profile-chart svg text",
    );

    if (textElement.length > 0) {
      textElement[textElement.length - 1].setAttribute("visibility", "hidden");
    }

    const simple = aggregate ? "visible" : "hidden";
    const details = detail ? "visible" : "hidden";

    if (textElement.length > 0) {
      textElement[textElement.length - 1].setAttribute("visibility", simple);
    }

    if (textElements.length > 0) {
      textElements[textElements.length - 1].setAttribute("visibility", details);
    }
  }, [detail, aggregate]);

  const handleState = (e: string, c: string) => {
    setTitle(e + " (" + c + ")");

    setSearchTerm("");
    setValue(e);
    setSectorId(sectors.filter((t) => t.code === c)?.[0].id);
    if (graphDetails === "Aggregate")
      props.widget.piePercentContribution.updateGraph(e, c);
    else props.widget.piePercentContributionSectors.updateGraph(e, c);
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
      handleState={handleState}
    />
  ));

  const onSearch = (value: string) => {
    if (!value) {
      setSearchTerm("");
    }
    const term = value.trimStart().toLowerCase();
    setSearchTerm(term.length === 0 ? "" : term);
  };

  const handleChange = (event: any) => {
    setGraph(event.target.value);
    setYear(new String(event.target.value).replace("GWP-AR6-", ""));
    if (graphDetails === "Aggregate")
      props.widget.piePercentContribution.changeGraph(
        event.target.value,
        value,
      );
    else
      props.widget.piePercentContributionSectors.changeGraph(
        event.target.value,
        value,
      );
  };

  React.useEffect(() => {
    //Changes meta title according to the graph selected
    document.title = getLabel(graph);
  }, [graph]);

  const handleChangePerspective = (event: any) => {
    setPerspective(event.target.value);
    props.widget.piePercentContribution.changePerspectiveGraph(
      event.target.value,
      graph,
      value,
    );
    props.widget.piePercentContributionSectors.changePerspectiveGraph(
      event.target.value,
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
    selector: {
      width: "auto",
      height: "200px",
      border: "1px solid black",
      overflowY: "scroll",
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
      width: "300px",
      marginBottom: "1em",
      "@media (max-width:1256px)": {
        bottom: "0",
        right: "0",
        width: "300px",
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
          <FormControl
            className={classes.margin}
            style={{ width: "min-content" }}
          >
            <TextField
              value={searchTerm}
              label="Search Sector"
              variant="outlined"
              size="small"
              onChange={(e) => onSearch(e.target.value)}
            />
            {searchTerm != null ? (
              <div className={classes.selector} id="div1">
                <table id="sector-list-table">
                  <thead>
                    <tr>
                      <th className={`indicator`}>
                        BEA/NAICS
                        <br />
                        Code
                      </th>
                      <th className={`indicator`}>Sector Name</th>
                    </tr>
                  </thead>
                  <tbody id="sectorListSearch" className="sector-list-body">
                    {rows}
                  </tbody>
                </table>
              </div>
            ) : null}
          </FormControl>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              flexWrap: "wrap",
            }}
          >
            <FormControl className={classes.margin}>
              <InputLabel id="demo-controlled-open-select-label">
                Select perspective:
              </InputLabel>
              <Select
                native
                value={perspective}
                onChange={handleChangePerspective}
                label="Select perspective"
                inputProps={{
                  name: "perspective",
                }}
              >
                <option value="final">Point of Consumption</option>
                <option value="direct">Supply Chain</option>
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
                {fileNames.map((file) => (
                  <option key={file} value={file}>
                    {getLabel(file)}
                  </option>
                ))}
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
          <div className={classes.linkSectors}>
            See more info about the{" "}
            <a href="./sector-info-table.html" target="_blank">
              sectors BEA/NAICS Codes
            </a>
            .
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
      fontSize: 12,
    },
  });
  const classes = useStyles();

  return (
    <tr>
      <td key={props.sector.code} className={classes.td}>
        <a
          style={{ cursor: "pointer" }}
          title={sector.code}
          onClick={() => props.handleState(sector.name, sector.code)}
        >
          {sector.code}
        </a>
      </td>
      <td className={classes.td}>
        <a
          style={{ cursor: "pointer" }}
          title={sector.name}
          onClick={() => props.handleState(sector.name, sector.code)}
        >
          {strings.cut(sector.name, 80)}
        </a>
      </td>
    </tr>
  );
};
