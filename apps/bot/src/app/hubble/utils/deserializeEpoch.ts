import type BN from "bn.js";

import type { HubbleTokenMap } from "../models";

const EPOCH_TO_SCALE_TO_SUM_TOKENS = 24;

export const deserializeEpoch = (
  data: BN[]
): Array<Omit<HubbleTokenMap<BigInt>, "usdh">[]> => {
  const hmap = [];
  const epochCount = data[1].toNumber();

  let currentCursor = 1;
  for (let i = 0; i < epochCount; i += 1) {
    currentCursor += 1;

    const scale = [];
    const scaleLength = data[currentCursor].toNumber();

    for (let j = 0; j < scaleLength; j += 1) {
      const tokenMap: Omit<HubbleTokenMap<BigInt>, "usdh"> = {
        sol: BigInt(data[currentCursor + 1].toString()),
        eth: BigInt(data[currentCursor + 2].toString()),
        btc: BigInt(data[currentCursor + 3].toString()),
        srm: BigInt(data[currentCursor + 4].toString()),
        ray: BigInt(data[currentCursor + 5].toString()),
        ftt: BigInt(data[currentCursor + 6].toString()),
        hbb: BigInt(data[currentCursor + 7].toString()),
        msol: BigInt(data[currentCursor + 8].toString())
      };

      scale.push(tokenMap);
      currentCursor += EPOCH_TO_SCALE_TO_SUM_TOKENS;
    }

    hmap.push(scale);
  }

  return hmap;
};
