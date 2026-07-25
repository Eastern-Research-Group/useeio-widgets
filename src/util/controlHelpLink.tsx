import * as React from "react";

/** Shared destinations for control help icons. */
export const CONTROL_HELP_HREFS = {
  perspectives: "./glossary.html#perspectives-help",
  indicators: "./indicator-list.html",
  levelOfDetail: "./glossary.html#level-of-detail",
} as const;

export type ControlHelpLinkProps = {
  href: string;
  /** Accessible name and hover tooltip (default: “What is this?”). */
  label?: string;
  /** Override icon glyph; defaults to “?”. */
  children?: React.ReactNode;
  className?: string;
};

/**
 * Compact icon-only help control for chart labels (Perspective, Indicator, Level of Detail).
 * Stops click propagation so MUI InputLabel / Select do not steal the click.
 */
export function ControlHelpLink({
  href,
  label = "What is this?",
  children = "?",
  className,
}: ControlHelpLinkProps): React.ReactElement {
  const classes = ["control-help-link", "control-help-link--icon", className]
    .filter(Boolean)
    .join(" ");
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
      aria-label={label}
      title={label}
      onClick={(e) => {
        e.stopPropagation();
      }}
      onMouseDown={(e) => {
        e.stopPropagation();
      }}
    >
      {children}
    </a>
  );
}
