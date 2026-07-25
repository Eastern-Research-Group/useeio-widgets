import * as React from "react";

export type SmartSectorResourceLinksProps = {
  className?: string;
};

/**
 * Shared footer resource links for pie / ranked / (and reusable elsewhere).
 */
export function SmartSectorResourceLinks({
  className,
}: SmartSectorResourceLinksProps): React.ReactElement {
  const classes = ["smart-sector-resource-links", className]
    .filter(Boolean)
    .join(" ");
  return (
    <div className={classes}>
      <span className="smart-sector-resource-line">
        See the{" "}
        <a
          href="./sector-info-table.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Sector Information Table
        </a>{" "}
        for more information.
      </span>
      <span className="smart-sector-resource-line">
        Use the{" "}
        <a
          href="./sector-dashboard.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Multi-indicator Sector Dashboard
        </a>{" "}
        to compare up to 6 indicators on one page.
      </span>
      <span className="smart-sector-resource-line">
        See the{" "}
        <a href="./glossary.html" target="_blank" rel="noopener noreferrer">
          Glossary
        </a>{" "}
        for definitions of terms.
      </span>
      <span className="smart-sector-resource-line">
        See the{" "}
        <a
          href="./indicator-list.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Indicator List
        </a>{" "}
        for indicator definitions.
      </span>
    </div>
  );
}
