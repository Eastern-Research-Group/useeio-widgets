import * as React from "react";
import { Sector } from "useeio";
import { TextField } from "@material-ui/core";
import FormControl from "@material-ui/core/FormControl";
import { makeStyles } from "@material-ui/core/styles";
import * as strings from "./strings";

export type SectorSearchTableProps = {
  sectors: Sector[];
  onPick: (sector: Sector) => void;
  /** Label shown on the search text field. Defaults to "Search Sector". */
  label?: string;
  /**
   * Maximum visible characters for the sector name column before truncating
   * (uses `strings.cut`). Defaults to 80.
   */
  nameCutLength?: number;
};

/**
 * Visual hierarchy metadata for one sector row. `parent_code` on each sector
 * (from upstream `sectors.json`) names the SMART parent row's `code`;
 * `isParent` rows render bold; children indent by `depth × INDENT_PX` in the
 * code column only.
 */
type HierarchyInfo = {
  depth: number;
  isParent: boolean;
};

const INDENT_PX = 16;

/** `sectors.json` carries `parent_code` from smart_sectors_useeio (not on `Sector` in useeio types). */
type SectorWithParent = Sector & { parent_code?: string | null };

function parentCodeOf(s: Sector): string | null {
  const v = (s as SectorWithParent).parent_code;
  if (v == null) {
    return null;
  }
  const t = String(v).trim();
  return t.length === 0 ? null : t;
}

/**
 * Sector rows whose name contains `(Sector Snapshots)` are an EPA-curated
 * cross-cutting view (e.g. `325 Chemical Manufacturing (Sector Snapshots)`,
 * `3273 Cement & Concrete (Sector Snapshots)`, `111/112 Agriculture (Sector
 * Snapshots)`), not part of the SMART parent/child grouping driven by
 * `parent_code`. They appear at the end
 * of the loaded sector list and are excluded from both parent and child
 * detection here so they render plain. They stay at the bottom of the list, and
 * a labelled separator row marks the transition.
 */
function isSectorSnapshot(name: string): boolean {
  return name.includes("(Sector Snapshots)");
}

/**
 * Keeps catalog order; only moves a child when another SMART parent row sits
 * between it and its `parent_code` parent (same indent would read as the wrong
 * family). Those rows are re-inserted right after their parent block.
 */
function reorderMisplacedChildren(
  main: Sector[],
  hierarchy: Map<string, HierarchyInfo>,
  parentLookupScope: Sector[],
): Sector[] {
  const byCode = new Map(parentLookupScope.map((s) => [s.code, s] as const));
  const isParentRow = (s: Sector) => hierarchy.get(s.code)?.isParent ?? false;

  const validParentCode = (s: Sector): string | null => {
    const pc = parentCodeOf(s);
    if (!pc) {
      return null;
    }
    const p = byCode.get(pc);
    if (!p || isSectorSnapshot(p.name)) {
      return null;
    }
    return pc;
  };

  const firstIndex = new Map<string, number>();
  main.forEach((s, i) => {
    if (!firstIndex.has(s.code)) {
      firstIndex.set(s.code, i);
    }
  });

  const misplacedAt = (si: number): boolean => {
    const s = main[si];
    const pc = validParentCode(s);
    if (!pc) {
      return false;
    }
    const pi = firstIndex.get(pc);
    if (pi === undefined || si <= pi) {
      return false;
    }
    for (let j = pi + 1; j < si; j++) {
      const row = main[j];
      if (isParentRow(row) && row.code !== pc) {
        return true;
      }
    }
    return false;
  };

  const moveIndices: number[] = [];
  for (let i = 0; i < main.length; i++) {
    if (misplacedAt(i)) {
      moveIndices.push(i);
    }
  }
  if (moveIndices.length === 0) {
    return [...main];
  }

  const moveSet = new Set(moveIndices);
  const stay = main.filter((_, i) => !moveSet.has(i));
  const toInsert = moveIndices.map((i) => main[i]);

  const result = [...stay];
  for (const s of toInsert) {
    const pc = validParentCode(s);
    if (!pc) {
      result.push(s);
      continue;
    }
    const parentIdx = result.findIndex((r) => r.code === pc);
    if (parentIdx < 0) {
      result.push(s);
      continue;
    }
    let insertAt = parentIdx + 1;
    while (insertAt < result.length) {
      const next = result[insertAt];
      if (validParentCode(next) === pc) {
        insertAt++;
      } else {
        break;
      }
    }
    result.splice(insertAt, 0, s);
  }
  return result;
}

function buildHierarchy(sectors: Sector[]): Map<string, HierarchyInfo> {
  const byCode = new Map(sectors.map((s) => [s.code, s] as const));
  const info = new Map<string, HierarchyInfo>();
  for (const s of sectors) {
    info.set(s.code, { depth: 0, isParent: false });
  }
  for (const child of sectors) {
    if (isSectorSnapshot(child.name)) {
      continue;
    }
    const pc = parentCodeOf(child);
    if (!pc) {
      continue;
    }
    const parent = byCode.get(pc);
    if (!parent || isSectorSnapshot(parent.name)) {
      continue;
    }
    const parentRec = info.get(pc);
    if (parentRec) {
      parentRec.isParent = true;
    }
    const childRec = info.get(child.code);
    if (childRec) {
      childRec.depth = 1;
    }
  }
  return info;
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
  rowCell: {
    borderTop: "lightgray solid 1px",
    padding: "5px 0px",
    whiteSpace: "nowrap",
    fontSize: 12,
  },
  rowLink: {
    cursor: "pointer",
  },
  snapshotSeparatorCell: {
    borderTop: "2px solid #999",
    padding: "8px 4px 4px",
    fontSize: 11,
    fontStyle: "italic",
    color: "#666",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  snapshotRowLink: {
    cursor: "pointer",
    fontStyle: "italic",
    color: "#555",
  },
}));

/**
 * Search-and-pick widget shared by the sector dashboard and the pie / ranked
 * smart-sector widgets. Renders a labelled text field above an always-visible
 * scrollable table of BEA/NAICS codes + sector names; the table filters as
 * the user types and clears the field on pick.
 */
export const SectorSearchTable: React.FC<SectorSearchTableProps> = ({
  sectors,
  onPick,
  label = "Search Sector",
  nameCutLength = 80,
}) => {
  const classes = useStyles();
  const [searchTerm, setSearchTerm] = React.useState<string>("");

  const hierarchy = React.useMemo(() => buildHierarchy(sectors), [sectors]);

  const orderedSectors = React.useMemo(() => {
    const snaps = sectors.filter((s) => isSectorSnapshot(s.name));
    const main = sectors.filter((s) => !isSectorSnapshot(s.name));
    return [...reorderMisplacedChildren(main, hierarchy, sectors), ...snaps];
  }, [sectors, hierarchy]);

  const onSearch = (value: string) => {
    if (!value) {
      setSearchTerm("");
      return;
    }
    const term = value.trimStart().toLowerCase();
    setSearchTerm(term.length === 0 ? "" : term);
  };

  const filtered = React.useMemo(() => {
    if (!searchTerm) {
      return orderedSectors;
    }
    const raw = orderedSectors.filter(
      (s) =>
        strings.search(s.name, searchTerm) >= 0 ||
        strings.search(s.code, searchTerm) >= 0,
    );
    const snaps = raw.filter((s) => isSectorSnapshot(s.name));
    const main = raw.filter((s) => !isSectorSnapshot(s.name));
    return [...reorderMisplacedChildren(main, hierarchy, sectors), ...snaps];
  }, [hierarchy, orderedSectors, searchTerm, sectors]);

  const pick = (sector: Sector) => {
    setSearchTerm("");
    onPick(sector);
  };

  return (
    <FormControl className={classes.margin}>
      <TextField
        value={searchTerm}
        label={label}
        variant="outlined"
        size="small"
        onChange={(e) => onSearch(e.target.value)}
      />
      <div className={classes.selector}>
        <table>
          <thead>
            <tr>
              <th className="indicator">
                BEA/NAICS
                <br />
                Code
              </th>
              <th className="indicator">Sector Name</th>
            </tr>
          </thead>
          <tbody className="sector-list-body">
            {(() => {
              const firstSnapshotIdx = filtered.findIndex((s) =>
                isSectorSnapshot(s.name),
              );
              return filtered.map((sector, idx) => {
                const info = hierarchy.get(sector.code) ?? {
                  depth: 0,
                  isParent: false,
                };
                const isSnapshot = isSectorSnapshot(sector.name);
                const codeCellStyle: React.CSSProperties = {
                  paddingLeft: info.depth * INDENT_PX,
                };
                const linkClass = isSnapshot
                  ? classes.snapshotRowLink
                  : classes.rowLink;
                const linkStyle: React.CSSProperties = info.isParent
                  ? { fontWeight: 600 }
                  : {};
                const showSeparator =
                  idx === firstSnapshotIdx && firstSnapshotIdx > 0;
                return (
                  <React.Fragment key={sector.code}>
                    {showSeparator && (
                      <tr>
                        <td
                          className={classes.snapshotSeparatorCell}
                          colSpan={2}
                        >
                          Sector Snapshots
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td className={classes.rowCell} style={codeCellStyle}>
                        <a
                          className={linkClass}
                          style={linkStyle}
                          title={sector.code}
                          onClick={() => pick(sector)}
                        >
                          {sector.code}
                        </a>
                      </td>
                      <td className={classes.rowCell}>
                        <a
                          className={linkClass}
                          style={linkStyle}
                          title={sector.name}
                          onClick={() => pick(sector)}
                        >
                          {strings.cut(sector.name, nameCutLength)}
                        </a>
                      </td>
                    </tr>
                  </React.Fragment>
                );
              });
            })()}
          </tbody>
        </table>
      </div>
    </FormControl>
  );
};
