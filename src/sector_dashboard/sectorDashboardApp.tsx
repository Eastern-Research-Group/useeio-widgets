import * as React from "react";
import { WebModel, Sector } from "useeio";
import { TextField } from "@material-ui/core";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import { makeStyles } from "@material-ui/core/styles";
import * as strings from "../util/strings";
import { getLabel } from "../util/util";
import { SECTOR_DASHBOARD_INDICATORS } from "./curatedIndicators";
import {
  buildIndustryOutputCaption,
  buildIndustryOutputSeriesMillionsUSD,
  getIndustryOutputChartOptions,
} from "./industryOutputChart";
import {
  buildSectorDashboardIntro,
  buildSectorDashboardInterpretation,
  buildSectorDashboardSectionBlurb,
  SECTOR_NAME_TOKEN,
} from "./sectorDashboardNarrative";
import { SectorDashboardOrchestrator } from "./sectorDashboardOrchestrator";

export type SectorDashboardAppProps = {
  model: WebModel;
  endpoint: "./api";
  sectors: Sector[];
  initialSectorCode?: string;
};

function renderSectorNarrative(
  text: string,
  sectorName: string,
): React.ReactNode {
  if (!text) {
    return null;
  }
  if (!text.includes(SECTOR_NAME_TOKEN)) {
    return text;
  }
  const parts = text.split(SECTOR_NAME_TOKEN);
  const nodes: React.ReactNode[] = [];
  parts.forEach((segment, idx) => {
    nodes.push(
      <React.Fragment key={`seg-${idx}`}>{segment}</React.Fragment>,
    );
    if (idx < parts.length - 1) {
      nodes.push(
        <strong key={`name-${idx}`}>
          <em>{sectorName}</em>
        </strong>,
      );
    }
  });
  return nodes;
}

function resolveInitialSector(
  sectors: Sector[],
  initialSectorCode?: string,
): Sector {
  if (initialSectorCode) {
    const c = initialSectorCode.trim();
    const hit = sectors.find(
      (s) => s.code === c || s.id === c || s.code.replace(/\s/g, "") === c,
    );
    if (hit) {
      return hit;
    }
  }
  return sectors[0];
}

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
  tagContainer: {
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
  chartGrid: {
    display: "grid",
  },
  chartCell: {
    gridColumn: "1",
    gridRow: "1",
    marginLeft: "10px",
    marginRight: "20px",
  },
  section: {
    marginTop: theme.spacing(3),
    breakInside: "avoid" as const,
  },
  snapshot: {
    border: "1px solid #ccc",
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    backgroundColor: "#f9f9f9",
  },
  interpretation: {
    borderLeft: "4px solid #2E93fA",
    backgroundColor: "#f5fafe",
    padding: theme.spacing(1.25, 2),
    margin: theme.spacing(1, 0, 2, 0),
    fontSize: 14,
    lineHeight: 1.5,
  },
  proxyDataNotice: {
    border: "1px solid #e65100",
    backgroundColor: "#fff8e1",
    padding: theme.spacing(1, 1.5),
    marginBottom: theme.spacing(1.5),
    fontSize: 13,
    lineHeight: 1.45,
  },
  outputChartHost: {
    width: "100%",
    maxWidth: 560,
    margin: "0 auto",
    height: 240,
  },
}));

export const SectorDashboardApp: React.FC<SectorDashboardAppProps> = ({
  model,
  endpoint,
  sectors,
  initialSectorCode,
}) => {
  const classes = useStyles();
  const bootSectorRef = React.useRef(
    resolveInitialSector(sectors, initialSectorCode),
  );
  const [searchTerm, setSearchTerm] = React.useState("");
  const [activeSector, setActiveSector] = React.useState<Sector>(() =>
    bootSectorRef.current,
  );
  const [perspective, setPerspective] = React.useState<"final" | "direct">(
    "final",
  );
  const [barMode, setBarMode] = React.useState<
    "impact_per_purchase" | "total_impact"
  >("impact_per_purchase");
  const [pieMode, setPieMode] = React.useState<"aggregate" | "detail">(
    "detail",
  );
  const [snapshotDate, setSnapshotDate] = React.useState(() =>
    new Date().toLocaleString(),
  );

  const orchRef = React.useRef<SectorDashboardOrchestrator | null>(null);
  const sectorSyncNeededRef = React.useRef(false);
  const perspectiveInitSkipRef = React.useRef(true);
  const barModeInitSkipRef = React.useRef(true);
  const pieModeInitSkipRef = React.useRef(true);
  const sectorNameRef = React.useRef(activeSector.name);
  const perspectiveRef = React.useRef(perspective);
  const [chartsReady, setChartsReady] = React.useState(false);
  const [, bumpNarrative] = React.useReducer((n: number) => n + 1, 0);
  const outputLineRef = React.useRef<HTMLDivElement | null>(null);
  const outputLineChartRef = React.useRef<ApexCharts | null>(null);
  sectorNameRef.current = activeSector.name;
  perspectiveRef.current = perspective;

  React.useEffect(() => {
    const el = outputLineRef.current;
    if (!el) {
      return;
    }
    if (outputLineChartRef.current) {
      outputLineChartRef.current.destroy();
      outputLineChartRef.current = null;
    }
    const chart = new ApexCharts(
      el,
      getIndustryOutputChartOptions(activeSector.name, activeSector.code),
    );
    chart.render();
    outputLineChartRef.current = chart;
    return () => {
      chart.destroy();
      outputLineChartRef.current = null;
    };
  }, [activeSector.name, activeSector.code]);

  React.useEffect(() => {
    document.title = "Sector dashboard (multi-indicator)";
  }, []);

  const industryOutputSeries = React.useMemo(
    () => buildIndustryOutputSeriesMillionsUSD(activeSector.code),
    [activeSector.code],
  );
  const industryOutputCaption = buildIndustryOutputCaption(industryOutputSeries);


  React.useEffect(() => {
    const onBeforePrint = () =>
      setSnapshotDate(new Date().toLocaleString());
    window.addEventListener("beforeprint", onBeforePrint);
    return () => window.removeEventListener("beforeprint", onBeforePrint);
  }, []);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const orch = new SectorDashboardOrchestrator(
          model,
          endpoint,
          SECTOR_DASHBOARD_INDICATORS,
        );
        orchRef.current = orch;
        await orch.initCharts(
          bootSectorRef.current.name,
          bootSectorRef.current.code,
        );
        if (alive) {
          setChartsReady(true);
          bumpNarrative();
        }
      } catch (e) {
        console.error("SectorDashboard chart error", e);
      }
    })();
    return () => {
      alive = false;
    };
  }, [model, endpoint]);

  React.useEffect(() => {
    document.title = `${activeSector.name} — Sector dashboard`;
  }, [activeSector.name]);

  React.useEffect(() => {
    if (!chartsReady || !orchRef.current || !sectorSyncNeededRef.current) {
      return;
    }
    sectorSyncNeededRef.current = false;
    void orchRef.current
      .setSector(activeSector.name, activeSector.code)
      .then(() => bumpNarrative())
      .catch((e) => console.error(e));
  }, [activeSector, chartsReady]);

  React.useEffect(() => {
    if (!chartsReady || !orchRef.current) {
      return;
    }
    if (perspectiveInitSkipRef.current) {
      perspectiveInitSkipRef.current = false;
      return;
    }
    void orchRef.current
      .setPerspective(perspective, sectorNameRef.current)
      .then(() => bumpNarrative())
      .catch((e) => console.error(e));
  }, [perspective, chartsReady]);

  React.useEffect(() => {
    if (!chartsReady || !orchRef.current) {
      return;
    }
    if (barModeInitSkipRef.current) {
      barModeInitSkipRef.current = false;
      return;
    }
    orchRef.current
      .refreshBarMode(
        barMode,
        sectorNameRef.current,
        perspectiveRef.current,
      )
      .then(() => bumpNarrative())
      .catch((e) => console.error(e));
  }, [barMode, chartsReady]);

  React.useEffect(() => {
    if (!chartsReady || !orchRef.current) {
      return;
    }
    if (pieModeInitSkipRef.current) {
      pieModeInitSkipRef.current = false;
      return;
    }
    orchRef.current.refreshPieMode(pieMode, sectorNameRef.current);
  }, [pieMode, chartsReady]);

  const narrativeInput = {
    sectorName: activeSector.name,
    sectorCode: activeSector.code,
    perspective,
    barMode,
    pieMode,
  };
  const introText = buildSectorDashboardIntro(narrativeInput);

  const onSearch = (value: string) => {
    if (!value) {
      setSearchTerm("");
      return;
    }
    const term = value.trimStart().toLowerCase();
    setSearchTerm(term.length === 0 ? "" : term);
  };

  let filtered = sectors;
  if (searchTerm) {
    filtered = sectors.filter(
      (s) =>
        strings.search(s.name, searchTerm) >= 0 ||
        strings.search(s.code, searchTerm) >= 0,
    );
  }

  const handlePickSector = (name: string, code: string) => {
    setSearchTerm("");
    const next = sectors.find((s) => s.code === code);
    if (next) {
      sectorSyncNeededRef.current = true;
      setActiveSector(next);
    }
  };

  const totalBarVis = barMode === "total_impact" ? "visible" : "hidden";
  const intBarVis = barMode === "impact_per_purchase" ? "visible" : "hidden";
  const pieAggVis = pieMode === "aggregate" ? "visible" : "hidden";
  const pieDetVis = pieMode === "detail" ? "visible" : "hidden";

  return (
    <div className="sector-dashboard-page">
      <h1 id="sector-dashboard-title" style={{ textAlign: "center" }}>
        Multi-indicator sector dashboard
      </h1>

      <div id="sector-dashboard-snapshot" className={classes.snapshot}>
        <p style={{ marginTop: 0 }}>
          {renderSectorNarrative(introText, activeSector.name)}
        </p>
        <p style={{ marginBottom: 0 }} className="sector-dashboard-snapshot-meta">
          Snapshot as of: {snapshotDate}. Perspective:{" "}
          {perspective === "final" ? "Point of consumption" : "Supply chain"}.
          Bar view:{" "}
          {barMode === "total_impact" ? "Total impacts" : "Impact intensity"}.
          Pie view: {pieMode === "aggregate" ? "Simple" : "Detailed"}.
        </p>
      </div>

      {!chartsReady ? (
        <p className="sector-dashboard-no-print" style={{ padding: "0 16px" }}>
          Loading charts…
        </p>
      ) : null}

      <div className={`sector-dashboard-controls sector-dashboard-no-print`}>
        <div className={classes.tagContainer}>
          <div className={classes.left}>
            <FormControl className={classes.margin}>
              <TextField
                value={searchTerm}
                label="Search sector"
                variant="outlined"
                size="small"
                onChange={(e) => onSearch(e.target.value)}
              />
              {searchTerm != null && searchTerm !== "" ? (
                <div className={classes.selector}>
                  <table id="sector-dashboard-sector-table">
                    <thead>
                      <tr>
                        <th>
                          BEA/NAICS
                          <br />
                          Code
                        </th>
                        <th>Sector name</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((sector) => (
                        <tr key={sector.code}>
                          <td
                            style={{
                              borderTop: "lightgray solid 1px",
                              fontSize: 12,
                            }}
                          >
                            <a
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                handlePickSector(sector.name, sector.code)
                              }
                            >
                              {sector.code}
                            </a>
                          </td>
                          <td
                            style={{
                              borderTop: "lightgray solid 1px",
                              fontSize: 12,
                            }}
                          >
                            <a
                              style={{ cursor: "pointer" }}
                              onClick={() =>
                                handlePickSector(sector.name, sector.code)
                              }
                            >
                              {strings.cut(sector.name, 80)}
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </FormControl>
          </div>

          <div className={classes.right}>
            <div className={classes.item}>
              <FormControl className={classes.margin}>
                <InputLabel htmlFor="sd-perspective">Perspective</InputLabel>
                <Select
                  native
                  id="sd-perspective"
                  value={perspective}
                  onChange={(e) =>
                    setPerspective(e.target.value as "final" | "direct")
                  }
                  inputProps={{ name: "perspective" }}
                >
                  <option value="final">Point of consumption</option>
                  <option value="direct">Supply chain</option>
                </Select>
              </FormControl>
            </div>
            <div className={classes.item}>
              <FormControl component="fieldset">
                <FormLabel component="legend" style={{ fontSize: "0.75rem" }}>
                  Bar chart
                </FormLabel>
                <RadioGroup
                  row
                  name="barMode"
                  value={barMode}
                  onChange={(e) =>
                    setBarMode(
                      e.target.value as "impact_per_purchase" | "total_impact",
                    )
                  }
                >
                  <FormControlLabel
                    value="impact_per_purchase"
                    control={<Radio color="default" size="small" />}
                    label="Impact intensity"
                  />
                  <FormControlLabel
                    value="total_impact"
                    control={<Radio color="default" size="small" />}
                    label="Total impacts"
                  />
                </RadioGroup>
              </FormControl>
            </div>
            <div className={classes.item}>
              <FormControl component="fieldset">
                <FormLabel component="legend" style={{ fontSize: "0.75rem" }}>
                  Pie chart
                </FormLabel>
                <RadioGroup
                  row
                  name="pieMode"
                  value={pieMode}
                  onChange={(e) =>
                    setPieMode(e.target.value as "aggregate" | "detail")
                  }
                >
                  <FormControlLabel
                    value="aggregate"
                    control={<Radio color="default" size="small" />}
                    label="Simple"
                  />
                  <FormControlLabel
                    value="detail"
                    control={<Radio color="default" size="small" />}
                    label="Detailed"
                  />
                </RadioGroup>
              </FormControl>
            </div>
            <div className={classes.item}>
              <button type="button" onClick={() => window.print()}>
                Print / Save as PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="sector-dashboard-sector-heading">
        <h2 style={{ textAlign: "center" }}>
          <em>{activeSector.name}</em> ({activeSector.code})
        </h2>
      </div>

      <section
        className={`sector-dashboard-section sector-dashboard-industry-output ${classes.section}`}
      >
        <h3>Industry output over time (2017–2023)</h3>
        <div className={classes.proxyDataNotice}>
          <strong>Proxy data:</strong> this line is not yet loaded from BEA.
        </div>
        <p
          style={{
            textAlign: "center",
            margin: "0 0 4px",
            fontSize: 13,
          }}
        >
          <strong>
            <em>{activeSector.name}</em>
          </strong>{" "}
          ({activeSector.code})
        </p>
        <div
          ref={outputLineRef}
          id="sector-dashboard-industry-output"
          className={classes.outputChartHost}
        />
        <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 8 }}>
          {renderSectorNarrative(industryOutputCaption, activeSector.name)}
        </p>
      </section>

      {SECTOR_DASHBOARD_INDICATORS.map((slug, i) => {
        const interpretation = chartsReady
          ? orchRef.current?.getInterpretation(
              i,
              activeSector.code,
              barMode,
            ) ?? null
          : null;
        const interpretationText = buildSectorDashboardInterpretation(
          narrativeInput,
          slug,
          interpretation,
        );
        return (
        <section
          key={slug}
          className={`sector-dashboard-section ${classes.section}`}
        >
          <h3>{getLabel(slug)}</h3>
          <p>
            {renderSectorNarrative(
              buildSectorDashboardSectionBlurb(narrativeInput, slug),
              activeSector.name,
            )}
          </p>
          <p
            className={`sector-dashboard-interpretation ${classes.interpretation}`}
          >
            {renderSectorNarrative(interpretationText, activeSector.name)}
          </p>
          <div
            style={{ fontWeight: "bold", textAlign: "center", marginBottom: 8 }}
          >
            Supplier contributions (ranked)
          </div>
          <div className={classes.chartGrid}>
            <div
              className={classes.chartCell}
              id={`sector-dash-bar-total-${i}`}
              style={{ visibility: totalBarVis }}
            />
            <div
              className={classes.chartCell}
              id={`sector-dash-bar-intensity-${i}`}
              style={{ visibility: intBarVis }}
            />
          </div>
          <div
            style={{
              fontWeight: "bold",
              textAlign: "center",
              margin: "16px 0 8px",
            }}
          >
            Direct vs indirect shares
          </div>
          <div className={classes.chartGrid}>
            <div
              className={classes.chartCell}
              id={`sector-dash-pie-agg-${i}`}
              style={{ visibility: pieAggVis }}
            />
            <div
              className={classes.chartCell}
              id={`sector-dash-pie-detail-${i}`}
              style={{ visibility: pieDetVis }}
            />
          </div>
        </section>
        );
      })}

      <div className="sector-dashboard-no-print" style={{ marginTop: 24 }}>
        <p style={{ fontSize: 13 }}>
          Saving this page as HTML still depends on <code>useeio_widgets.js</code>,{" "}
          ApexCharts, and local JSON under <code>./api/</code>. For a portable
          artifact, use Print → Save as PDF. Archiving the full{" "}
          <code>build/</code> folder preserves relative links for offline viewing.
        </p>
      </div>
    </div>
  );
};
