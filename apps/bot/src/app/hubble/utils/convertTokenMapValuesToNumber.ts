import BN from "bn.js";

import type { HubbleTokenMap } from "../models";

export const convertTokenMapValuesToNumber = (
  originalMap: HubbleTokenMap<BN | bigint>
) => {
  let convertedMap: Partial<HubbleTokenMap<number>> = {};

  for (const [key, value] of Object.entries(originalMap)) {
    let newValue = undefined;

    if (BN.isBN(value)) {
      newValue = value.toNumber();
    } else if (typeof value === "bigint") {
      newValue = Number(value);
    }

    if (newValue) {
      convertedMap = {
        ...convertedMap,
        [key]: newValue
      };
    }
  }

  return convertedMap;
};
