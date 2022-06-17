import type { NumberReadability, TokenKind } from "../../core/models";
import { formatTokenValue } from "../../core/utils/formatTokenValue";
import type { HubbleTokenMap } from "../models";

export const formatTokenMap = (
  tokenMap: Partial<HubbleTokenMap<number>>,
  readability: NumberReadability
) => {
  const formatted: Partial<HubbleTokenMap<BigInt>> = {};

  for (const [key, value] of Object.entries(tokenMap)) {
    formatted[key] = formatTokenValue(key as TokenKind, value, readability);
  }

  return formatted;
};
