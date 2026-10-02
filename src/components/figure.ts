/*
 * Copy figures ("1.2M+", "2,100+"): parsing and formatting shared by
 * <CountUp> and server code. Kept out of the client module, so server
 * components can call parseFigure().
 */

/** A figure split into the number that counts and the text around it. */
export type ParsedFigure = {
  /** Text before the number, e.g. "~" or "€". */
  prefix: string;
  /** The number itself, e.g. 1.2 for "1.2M+". */
  value: number;
  /** Fraction digits in the source, e.g. 1 for "2.3%". */
  decimals: number;
  /** Whether the source groups thousands ("2,100"). */
  grouping: boolean;
  /** Text after the number, e.g. "M+" or "%". */
  suffix: string;
};

const figurePattern = /^(\D*?)(\d{1,3}(?:,\d{3})+|\d+)(?:\.(\d+))?(\D*)$/;

/**
 * Splits a copy figure such as "1.2M+", "20k+", "2.3%", "~500" or "2,100+"
 * into prefix, number and suffix. Returns null for text that holds no number
 * or more than one (a year range, "24/7"): those are shown as they are.
 */
export function parseFigure(text: string): ParsedFigure | null {
  const match = figurePattern.exec(text.trim());
  if (!match) return null;
  const [, prefix = "", whole = "", fraction = "", suffix = ""] = match;
  return {
    prefix,
    value: Number(`${whole.replaceAll(",", "")}.${fraction || "0"}`),
    decimals: fraction.length,
    grouping: whole.includes(","),
    suffix,
  };
}

/** Formats `value` in the shape of a parsed figure (prefix, digits, suffix). */
export function formatFigure(value: number, figure: Omit<ParsedFigure, "value">) {
  return `${figure.prefix}${value.toLocaleString("en-US", {
    minimumFractionDigits: figure.decimals,
    maximumFractionDigits: figure.decimals,
    useGrouping: figure.grouping,
  })}${figure.suffix}`;
}
