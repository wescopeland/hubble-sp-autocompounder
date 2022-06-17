import type { NumberReadability, TokenKind } from "../models";
import { tokenKindDecimalsMap } from "./tokenKindDecimalsMap";

/**
 * Takes a native token value and converts it to human-readable format.
 */
export const formatTokenValue = (
  kind: TokenKind,
  value: number,
  type: NumberReadability
) => {
  const exponentiation = 10 ** tokenKindDecimalsMap[kind];

  if (type === "human") {
    return value / exponentiation;
  }

  if (type === "program") {
    return value * 10 ** tokenKindDecimalsMap[kind];
  }
};
