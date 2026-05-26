import * as React from "react";
import IconButton from "@material-ui/core/IconButton";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";

export type ChartExportFormat = "png" | "svg" | "csv";

export type ChartExportMenuProps = {
  onExport: (format: ChartExportFormat) => void;
  /** Wrapper style (e.g. align menu above chart). */
  style?: React.CSSProperties;
};

/**
 * Shared download control for ranked, pie, and stacked smart-sector charts.
 */
export const ChartExportMenu: React.FC<ChartExportMenuProps> = ({
  onExport,
  style,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const close = (format?: ChartExportFormat) => {
    if (format) {
      onExport(format);
    }
    setAnchorEl(null);
  };

  return (
    <div
      className="chart-export-menu"
      style={{
        display: "flex",
        justifyContent: "flex-end",
        width: "100%",
        ...style,
      }}
    >
      <IconButton
        aria-label="Download chart"
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path fill="none" d="M0 0h24v24H0V0z" />
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" />
        </svg>
      </IconButton>
      <Menu anchorEl={anchorEl} open={open} onClose={() => close()}>
        <MenuItem onClick={() => close("svg")}>Download SVG</MenuItem>
        <MenuItem onClick={() => close("png")}>Download PNG</MenuItem>
        <MenuItem onClick={() => close("csv")}>Download CSV</MenuItem>
      </Menu>
    </div>
  );
};
