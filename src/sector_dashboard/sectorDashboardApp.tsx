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
import { getLabel, normalizeSectorCodeBase, pickPreferredBootSector } from "../util/util";
import { SectorSearchTable } from "../util/sectorSearchTable";
import {
  CONTROL_HELP_HREFS,
  ControlHelpLink,
} from "../util/controlHelpLink";
import {
  modelOfSmartSector,
  CommodityOutputTimeSeriesRow,
  DataRow,
} from "../smartSectorWebApi.ts/webApiSmartSector";
import {
  encodeIndicatorsParam,
  indicatorDomId,
  resolveIndicatorsFromParam,
} from "./indicatorCodes";
import { IndicatorPickerModal } from "./indicatorPickerModal";
import {
  buildIndustryOutputCaption,
  buildIndustryOutputSeriesFromCatalog,
  formatIndustryOutputYearRange,
  getIndustryOutputChartOptions,
  INDUSTRY_OUTPUT_CHART_HEIGHT,
  INDUSTRY_OUTPUT_CHART_MAX_WIDTH,
  INDUSTRY_OUTPUT_DOLLAR_YEAR,
  INDUSTRY_OUTPUT_FOCAL_YEAR,
} from "./industryOutputChart";
import {
  buildSectorDashboardIndicatorsBlurb,
  buildSectorDashboardInterpretation,
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
  initialInd?: string;
};

function buildShareUrl(input: {
  sectorCode: string;
  perspective: "final" | "direct";
  barMode: "impact_per_purchase" | "total_impact";
  pieMode: "aggregate" | "detail";
  indicatorSlugs: readonly string[];
}): string {
  const params = new URLSearchParams();
  if (input.sectorCode) {
    params.set("sector", input.sectorCode);
  }
  params.set("perspective", input.perspective);
  params.set("bar", input.barMode === "total_impact" ? "total" : "intensity");
  params.set("pie", input.pieMode === "detail" ? "detailed" : "simple");
  const url = new URL(window.location.href);
  const ind = encodeIndicatorsParam(input.indicatorSlugs);
  const qs = params.toString();
  // Append ind with literal commas (codes are alphanumeric; URLSearchParams would use %2C).
  url.search = qs ? `${qs}&ind=${ind}` : `ind=${ind}`;
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
    flex: "0 1 40rem",
    minWidth: "min(100%, 24rem)",
    maxWidth: "40rem",
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
    fontSize: 16,
    lineHeight: 1.5,
  },
  outputDataNotice: {
    border: "1px solid #e0e0e0",
    backgroundColor: "#f5f5f5",
    padding: theme.spacing(1, 1.5),
    marginBottom: theme.spacing(1.5),
    fontSize: 15,
    lineHeight: 1.45,
  },
  sectorDescription: {
    maxWidth: INDUSTRY_OUTPUT_CHART_MAX_WIDTH,
    margin: "0 auto",
    padding: theme.spacing(0, 2, 1),
    fontSize: 15,
    lineHeight: 1.55,
    textAlign: "left" as const,
  },
  sectorDescriptionGroup: {
    display: "block",
    marginBottom: theme.spacing(0.5),
    fontSize: 13,
    color: "#555",
  },
  outputChartHost: {
    width: "100%",
    maxWidth: INDUSTRY_OUTPUT_CHART_MAX_WIDTH,
    margin: "0 auto",
    height: INDUSTRY_OUTPUT_CHART_HEIGHT,
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
  initialInd,
}) => {
  const classes = useStyles();
  const [appliedIndicators, setAppliedIndicators] = React.useState<string[]>(
    () => resolveIndicatorsFromParam(initialInd),
  );
  const [indicatorModalOpen, setIndicatorModalOpen] = React.useState(false);
  const [indicatorDraft, setIndicatorDraft] = React.useState<string[]>([]);
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
  >(initialBarMode ?? "total_impact");
  const [pieMode, setPieMode] = React.useState<"aggregate" | "detail">(
    initialPieMode ?? "detail",
  );
  const [shareStatus, setShareStatus] = React.useState<
    "idle" | "copied" | "manual"
  >("idle");
  const [shareUrlForFallback, setShareUrlForFallback] = React.useState("");
  // Restore with print snapshot block below.
  // const [snapshotDate, setSnapshotDate] = React.useState(() =>
  //   new Date().toLocaleString(),
  // );
  const [outputTimeSeries, setOutputTimeSeries] = React.useState<
    CommodityOutputTimeSeriesRow[] | null
  >(null);
  const [outputTimeSeriesError, setOutputTimeSeriesError] =
    React.useState(false);
  const [sectorInfoRows, setSectorInfoRows] = React.useState<DataRow[] | null>(
    null,
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
    let cancelled = false;
    const api = modelOfSmartSector({
      endpoint,
      model: model.id() as string,
      asJsonFiles: true,
    });
    api
      .commodityOutputTimeSeries()
      .then((rows) => {
        if (!cancelled) {
          setOutputTimeSeries(rows);
          setOutputTimeSeriesError(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setOutputTimeSeries(null);
          setOutputTimeSeriesError(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint, model]);

  // Sector descriptions live under SMART_TABLE_RECORDS (same source as the
  // Sector Information Table), not the chart model tree.
  React.useEffect(() => {
    let cancelled = false;
    const infoApi = modelOfSmartSector({
      endpoint,
      model: "SMART_TABLE_RECORDS",
      asJsonFiles: true,
    });
    infoApi
      .sectorRecordList()
      .then((rows) => {
        if (!cancelled) {
          setSectorInfoRows(rows);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSectorInfoRows(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [endpoint]);

  const activeSectorInfo = React.useMemo(() => {
    if (!sectorInfoRows?.length) {
      return null;
    }
    const key = normalizeSectorCodeBase(activeSector.code);
    return (
      sectorInfoRows.find(
        (row) => normalizeSectorCodeBase(row.Code) === key,
      ) ?? null
    );
  }, [sectorInfoRows, activeSector.code]);

  const industryOutputSeries = React.useMemo(
    () =>
      buildIndustryOutputSeriesFromCatalog(
        outputTimeSeries,
        activeSector.id,
        activeSector.code,
      ),
    [outputTimeSeries, activeSector.id, activeSector.code],
  );

  const industryOutputYearRange = formatIndustryOutputYearRange(
    industryOutputSeries,
  );

  React.useEffect(() => {
    const el = outputLineRef.current;
    if (!el) {
      return;
    }
    const options = getIndustryOutputChartOptions(
      activeSector.name,
      industryOutputSeries,
    );
    if (outputLineChartRef.current) {
      outputLineChartRef.current.destroy();
      outputLineChartRef.current = null;
    }
    const chart = new ApexCharts(el, options);
    void chart.render().then(() => {
      outputLineChartRef.current = chart;
    });
    return () => {
      void chart.destroy();
      if (outputLineChartRef.current === chart) {
        outputLineChartRef.current = null;
      }
    };
  }, [
    activeSector.id,
    activeSector.code,
    activeSector.name,
    industryOutputSeries,
  ]);

  React.useEffect(() => {
    setShareStatus("idle");
    setShareUrlForFallback("");
  }, [activeSector.code, perspective, barMode, pieMode, appliedIndicators]);

  const industryOutputCaption = buildIndustryOutputCaption(industryOutputSeries);

  // React.useEffect(() => {
  //   const onBeforePrint = () =>
  //     setSnapshotDate(new Date().toLocaleString());
  //   window.addEventListener("beforeprint", onBeforePrint);
  //   return () => window.removeEventListener("beforeprint", onBeforePrint);
  // }, []);

  React.useEffect(() => {
    let alive = true;
    setChartsReady(false);
    orchRef.current?.destroyCharts();
    orchRef.current = null;
    perspectiveInitSkipRef.current = true;
    barModeInitSkipRef.current = true;
    pieModeInitSkipRef.current = true;

    (async () => {
      try {
        const orch = new SectorDashboardOrchestrator(
          model,
          endpoint,
          appliedIndicators,
        );
        orchRef.current = orch;
        await orch.initCharts(activeSector.name, activeSector.code);
        await orch.setPerspective(
          perspectiveRef.current,
          activeSector.name,
        );
        await orch.refreshBarMode(
          barMode,
          activeSector.name,
          perspectiveRef.current,
        );
        orch.refreshPieMode(pieModeRef.current, activeSector.name);
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
      orchRef.current?.destroyCharts();
      orchRef.current = null;
    };
  }, [model, endpoint, appliedIndicators]);

  React.useEffect(() => {
    document.title = `${activeSector.name} — Multi-indicator Sector Dashboard`;
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
    indicatorSlugs: appliedIndicators,
  };
  // const introText = buildSectorDashboardIntro(narrativeInput);

  const openIndicatorModal = () => {
    setIndicatorDraft([...appliedIndicators]);
    setIndicatorModalOpen(true);
  };

  const applyIndicatorDraft = () => {
    if (indicatorDraft.length === 0) {
      return;
    }
    setAppliedIndicators([...indicatorDraft]);
    setIndicatorModalOpen(false);
    const url = buildShareUrl({
      sectorCode: activeSector.code,
      perspective,
      barMode,
      pieMode,
      indicatorSlugs: indicatorDraft,
    });
    window.history.replaceState(null, "", url);
  };

  const cancelIndicatorModal = () => {
    setIndicatorModalOpen(false);
    setIndicatorDraft([]);
  };

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
      indicatorSlugs: appliedIndicators,
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
        Multi-indicator Sector Dashboard
      </h1>

      {/* Print-snapshot intro + meta — hidden from live UI; restore for PDF/print flows.
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
      */}

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
              <button
                type="button"
                className="sector-dashboard-choose-indicators"
                onClick={openIndicatorModal}
              >
                Choose indicators ({appliedIndicators.length})
              </button>{" "}
              <ControlHelpLink
                href={CONTROL_HELP_HREFS.indicators}
                className="sector-dashboard-no-print"
              />
            </div>
            <div className={classes.item}>
              <FormControl className={classes.margin}>
                <InputLabel
                  htmlFor="sd-perspective"
                  className="sector-dashboard-control-label"
                >
                  Perspective{" "}
                  <ControlHelpLink
                    href={CONTROL_HELP_HREFS.perspectives}
                    className="sector-dashboard-no-print"
                  />
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
                <FormLabel component="legend" className="sector-dashboard-control-label">
                  Bar Chart Metric
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
                <FormLabel component="legend" className="sector-dashboard-control-label">
                  Pie Chart Format{" "}
                  <ControlHelpLink
                    href={CONTROL_HELP_HREFS.levelOfDetail}
                    className="sector-dashboard-no-print"
                  />
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
        {activeSectorInfo?.Description ? (
          <p className={classes.sectorDescription}>
            {activeSectorInfo.Group ? (
              <span className={classes.sectorDescriptionGroup}>
                {activeSectorInfo.Group}
              </span>
            ) : null}
            {activeSectorInfo.Description}
          </p>
        ) : null}
      </div>

      <section
        className={`sector-dashboard-section sector-dashboard-industry-output ${classes.section}`}
      >
        <h3>
          Industry Price Adjusted Output Over Time ({industryOutputYearRange})
        </h3>
        <div className={classes.outputDataNotice}>
          {outputTimeSeriesError ? (
            <>
              <strong>Data unavailable:</strong> could not load commodity output
              time series. Re-run <code>smart_sectors.R</code> to publish{" "}
              <code>commodity_output_timeseries.json</code>.
            </>
          ) : industryOutputSeries ? (
            <>
              <strong>Price-adjusted output:</strong> yearly BEA gross commodity
              output converted to constant {INDUSTRY_OUTPUT_DOLLAR_YEAR} dollars
              (using BEA chain-type price indexes for gross output, via the
              model's price adjustment), in millions of dollars — the same dollar
              basis as the {INDUSTRY_OUTPUT_FOCAL_YEAR} output used for total
              impacts below.
            </>
          ) : (
            <>
              <strong>No series for this sector:</strong> choose another sector or
              regenerate upstream output data.
            </>
          )}
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

      <IndicatorPickerModal
        open={indicatorModalOpen}
        draft={indicatorDraft}
        onDraftChange={setIndicatorDraft}
        onApply={applyIndicatorDraft}
        onCancel={cancelIndicatorModal}
      />

      <section className={`sector-dashboard-indicators ${classes.section}`}>
        <h2 style={{ fontSize: "1.35rem", marginBottom: 8 }}>Indicators</h2>
        <p style={{ fontSize: 14, lineHeight: 1.55, marginTop: 0 }}>
          {renderSectorNarrative(
            buildSectorDashboardIndicatorsBlurb(narrativeInput),
            activeSector.name,
          )}
        </p>
      </section>

      {appliedIndicators.map((slug, i) => {
        const domId = indicatorDomId(slug);
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
              id={`sector-dash-pie-agg-${domId}`}
              style={{ visibility: pieAggVis }}
            />
            <div
              className={classes.chartCell}
              id={`sector-dash-pie-detail-${domId}`}
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
              id={`sector-dash-bar-total-${domId}`}
              style={{ visibility: totalBarVis }}
            />
            <div
              className={classes.chartCell}
              id={`sector-dash-bar-intensity-${domId}`}
              style={{ visibility: intBarVis }}
            />
          </div>
        </section>
        );
      })}
    </div>
  );
};
