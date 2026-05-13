import * as React from "react";
import { WebModel, Sector } from "useeio";
import InputLabel from "@material-ui/core/InputLabel";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import Radio from "@material-ui/core/Radio";
import RadioGroup from "@material-ui/core/RadioGroup";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import FormLabel from "@material-ui/core/FormLabel";
import { makeStyles } from "@material-ui/core/styles";
import { getLabel, pickPreferredBootSector } from "../util/util";
import { SectorSearchTable } from "../util/sectorSearchTable";
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
  initialPerspective?: "final" | "direct";
  initialBarMode?: "impact_per_purchase" | "total_impact";
  initialPieMode?: "aggregate" | "detail";
};

function buildShareUrl(input: {
  sectorCode: string;
  perspective: "final" | "direct";
  barMode: "impact_per_purchase" | "total_impact";
  pieMode: "aggregate" | "detail";
}): string {
  const params = new URLSearchParams();
  if (input.sectorCode) {
    params.set("sector", input.sectorCode);
  }
  params.set("perspective", input.perspective);
  params.set("bar", input.barMode === "total_impact" ? "total" : "intensity");
  params.set("pie", input.pieMode === "detail" ? "detailed" : "simple");
  const url = new URL(window.location.href);
  url.search = params.toString();
  url.hash = "";
  return url.toString();
}

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
  return (
    pickPreferredBootSector(sectors) ??
    sectors[0]
  );
}

const useStyles = makeStyles((theme) => ({
  margin: {
    margin: theme.spacing(1),
    minWidth: 150,
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
  initialPerspective,
  initialBarMode,
  initialPieMode,
}) => {
  const classes = useStyles();
  const bootSectorRef = React.useRef(
    resolveInitialSector(sectors, initialSectorCode),
  );
  const [activeSector, setActiveSector] = React.useState<Sector>(() =>
    bootSectorRef.current,
  );
  const [perspective, setPerspective] = React.useState<"final" | "direct">(
    initialPerspective ?? "final",
  );
  const [barMode, setBarMode] = React.useState<
    "impact_per_purchase" | "total_impact"
  >(initialBarMode ?? "impact_per_purchase");
  const [pieMode, setPieMode] = React.useState<"aggregate" | "detail">(
    initialPieMode ?? "detail",
  );
  const [shareStatus, setShareStatus] = React.useState<
    "idle" | "copied" | "manual"
  >("idle");
  const [shareUrlForFallback, setShareUrlForFallback] = React.useState("");
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
  const pieModeRef = React.useRef(pieMode);
  sectorNameRef.current = activeSector.name;
  perspectiveRef.current = perspective;
  pieModeRef.current = pieMode;

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

  React.useEffect(() => {
    setShareStatus("idle");
    setShareUrlForFallback("");
  }, [activeSector.code, perspective, barMode, pieMode]);

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
      .then(() => {
        orchRef.current?.refreshPieMode(
          pieModeRef.current,
          sectorNameRef.current,
        );
        bumpNarrative();
      })
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

  const handlePickSector = (picked: Sector) => {
    const next = sectors.find((s) => s.code === picked.code) ?? picked;
    sectorSyncNeededRef.current = true;
    setActiveSector(next);
  };

  const handleCopyShareLink = async () => {
    const url = buildShareUrl({
      sectorCode: activeSector.code,
      perspective,
      barMode,
      pieMode,
    });
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setShareStatus("copied");
        setShareUrlForFallback("");
        window.setTimeout(() => setShareStatus("idle"), 2000);
        return;
      }
    } catch (e) {
      console.warn("clipboard write failed", e);
    }
    setShareUrlForFallback(url);
    setShareStatus("manual");
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
            <SectorSearchTable sectors={sectors} onPick={handlePickSector} />
          </div>

          <div className={classes.right}>
            <div className={classes.item}>
              <FormControl className={classes.margin}>
                <InputLabel htmlFor="sd-perspective">
                  Perspective{" "}
                  <a
                    href="./glossary.html#perspectives-help"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sector-dashboard-no-print"
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: 400,
                      marginLeft: 4,
                    }}
                  >
                    What is this?
                  </a>
                </InputLabel>
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
              <button
                type="button"
                style={{ marginLeft: 8 }}
                onClick={handleCopyShareLink}
                title="Copy a URL that opens this dashboard with the current sector and toggles preselected"
              >
                {shareStatus === "copied"
                  ? "Link copied!"
                  : "Copy share link"}
              </button>
              {shareStatus === "manual" && shareUrlForFallback ? (
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  <label
                    htmlFor="sector-dashboard-share-url"
                    style={{ display: "block", marginBottom: 2 }}
                  >
                    Copy this URL:
                  </label>
                  <input
                    id="sector-dashboard-share-url"
                    type="text"
                    readOnly
                    value={shareUrlForFallback}
                    style={{ width: "100%", boxSizing: "border-box" }}
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              ) : null}
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
            style={{
              fontWeight: "bold",
              textAlign: "center",
              marginBottom: 8,
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
          <div
            style={{
              fontWeight: "bold",
              textAlign: "center",
              margin: "16px 0 8px",
            }}
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
