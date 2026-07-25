import * as React from "react";
import {
  getIndicatorSelectGroups,
  getLabel,
} from "./indicatorCatalog";

export type IndicatorOptGroupsProps = {
  /** Slugs to omit (e.g. sector-purchases on stacked page). */
  excludeSlugs?: readonly string[];
};

/** Native `<optgroup>` / `<option>` nodes for MUI `Select native` or plain `<select>`. */
export function IndicatorOptGroups({
  excludeSlugs,
}: IndicatorOptGroupsProps): React.ReactElement {
  const groups = getIndicatorSelectGroups({ excludeSlugs });
  return (
    <>
      {groups.map((group) => (
        <optgroup key={group.id} label={group.label}>
          {group.slugs.map((file) => (
            <option key={file} value={file}>
              {getLabel(file)}
            </option>
          ))}
        </optgroup>
      ))}
    </>
  );
}
