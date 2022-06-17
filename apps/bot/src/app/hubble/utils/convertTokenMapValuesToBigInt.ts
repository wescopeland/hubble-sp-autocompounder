import BN from "bn.js";

import type { HubbleTokenMap } from "../models";

export const convertTokenMapValuesToBigInt = (
  originalMap: HubbleTokenMap<BN>
): HubbleTokenMap<BigInt> => {
  let convertedMap: Partial<HubbleTokenMap<BigInt>> = {};

  for (const [key, value] of Object.entries(originalMap)) {
    // This guards against a `reserved` array which could
    // contain a list of BN entities we don't care about.
    if (BN.isBN(value)) {
      convertedMap = {
        ...convertedMap,
        [key]: BigInt(value.toString())
      };
    }
  }

  return convertedMap as HubbleTokenMap<BigInt>;
};
