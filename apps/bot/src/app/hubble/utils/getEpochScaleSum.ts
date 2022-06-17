import type { HubbleTokenMap } from "../models";

export const getEpochScaleSum = (
  epochToScaleToSum: Omit<HubbleTokenMap<BigInt>, "usdh">[][],
  epoch: number,
  scale: number
): Omit<HubbleTokenMap<BigInt>, "usdh"> => {
  if (
    epoch < epochToScaleToSum.length &&
    scale < epochToScaleToSum[epoch].length
  ) {
    return epochToScaleToSum[epoch][scale];
  }

  return {
    sol: BigInt(0),
    eth: BigInt(0),
    btc: BigInt(0),
    srm: BigInt(0),
    ray: BigInt(0),
    ftt: BigInt(0),
    hbb: BigInt(0),
    msol: BigInt(0)
  };
};
