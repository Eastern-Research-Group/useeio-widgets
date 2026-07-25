import * as React from "react";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import { getIndicatorSelectGroups, getLabel, SECTOR_PURCHASES_FILE_SLUG } from "../util/util";
import {
  SECTOR_DASHBOARD_MAX_INDICATORS,
  SECTOR_DASHBOARD_PICKABLE,
  slugToIndicatorCode,
} from "./indicatorCodes";

export type IndicatorPickerModalProps = {
  open: boolean;
  draft: readonly string[];
  onDraftChange: (next: string[]) => void;
  onApply: () => void;
  onCancel: () => void;
};

export const IndicatorPickerModal: React.FC<IndicatorPickerModalProps> = ({
  open,
  draft,
  onDraftChange,
  onApply,
  onCancel,
}) => {
  const [filter, setFilter] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setFilter("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  const q = filter.trim().toLowerCase();
  const matchesFilter = (slug: string): boolean => {
    if (!q) {
      return true;
    }
    const code = slugToIndicatorCode(slug).toLowerCase();
    return (
      slug.toLowerCase().includes(q) ||
      code.includes(q) ||
      getLabel(slug).toLowerCase().includes(q)
    );
  };

  const pickable = new Set(SECTOR_DASHBOARD_PICKABLE);
  const groups = getIndicatorSelectGroups({
    excludeSlugs: [SECTOR_PURCHASES_FILE_SLUG],
  })
    .map((g) => ({
      ...g,
      slugs: g.slugs.filter((slug) => pickable.has(slug) && matchesFilter(slug)),
    }))
    .filter((g) => g.slugs.length > 0);

  const atMax = draft.length >= SECTOR_DASHBOARD_MAX_INDICATORS;

  const toggle = (slug: string, checked: boolean) => {
    if (checked) {
      if (draft.includes(slug) || draft.length >= SECTOR_DASHBOARD_MAX_INDICATORS) {
        return;
      }
      onDraftChange([...draft, slug]);
      return;
    }
    onDraftChange(draft.filter((s) => s !== slug));
  };

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div
      className="modal sector-dashboard-indicator-modal"
      style={{ display: "block" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="sd-indicator-modal-title"
      onClick={handleBackdrop}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <span
          className="close sector-dashboard-no-print"
          role="button"
          tabIndex={0}
          aria-label="Close"
          onClick={onCancel}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              onCancel();
            }
          }}
        >
          &times;
        </span>
        <h3 id="sd-indicator-modal-title" style={{ marginTop: 0 }}>
          Choose indicators ({draft.length} selected, max{" "}
          {SECTOR_DASHBOARD_MAX_INDICATORS})
        </h3>
        <input
          type="text"
          placeholder="Filter by code or name"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            width: "100%",
            marginBottom: "0.75em",
            padding: "0.5em",
            borderRadius: "0.1em",
            border: "1px solid #ccc",
            boxSizing: "border-box",
          }}
        />
        <div
          id="scrollContainer"
          style={{ maxHeight: "40vh", overflowY: "auto" }}
        >
          {groups.map((group) => (
            <div key={group.id} className="sector-dashboard-indicator-group">
              <div className="sector-dashboard-indicator-group-label">
                {group.label}
              </div>
              {group.slugs.map((slug) => {
                const checked = draft.includes(slug);
                const disabled = !checked && atMax;
                return (
                  <FormControlLabel
                    key={slug}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      marginLeft: 0,
                      marginRight: 0,
                      opacity: disabled ? 0.5 : 1,
                    }}
                    control={
                      <Checkbox
                        color="primary"
                        size="small"
                        checked={checked}
                        disabled={disabled}
                        onChange={(e) => toggle(slug, e.target.checked)}
                      />
                    }
                    label={`${slugToIndicatorCode(slug)} — ${getLabel(slug)}`}
                  />
                );
              })}
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            marginTop: 16,
          }}
        >
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            disabled={draft.length === 0}
            onClick={onApply}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};
