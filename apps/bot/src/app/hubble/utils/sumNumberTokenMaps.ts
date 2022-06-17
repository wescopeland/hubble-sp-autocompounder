import type { TokenKind } from "../../core/models";
import type { HubbleTokenMap } from "../models";

export const sumNumberTokenMaps = (
  a: Partial<HubbleTokenMap<number>>,
  b: Partial<HubbleTokenMap<number>>
) => {
  const tracked: Partial<Record<TokenKind, number[]>> = {};
  for (const [key, value] of Object.entries(a)) {
    tracked[key] = [value];
  }
  for (const [key, value] of Object.entries(b)) {
    if (tracked[key]) {
      tracked[key].push(value);
    } else {
      tracked[key] = [value];
    }
  }

  const summed: Partial<Record<TokenKind, number>> = {};
  for (const [key, value] of Object.entries(tracked)) {
    let sum = 0;

    for (const num of value) {
      sum += num;
    }

    summed[key] = sum;
  }

  return summed;
};
