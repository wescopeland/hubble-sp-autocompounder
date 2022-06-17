import type { HubbleTokenMap } from "../models";

export const tokenMapMath = {
  add: (
    left: Omit<HubbleTokenMap<BigInt>, "usdh">,
    right: Omit<HubbleTokenMap<BigInt>, "usdh">
  ): Omit<HubbleTokenMap<BigInt>, "usdh"> => ({
    sol: left.sol.valueOf() + right.sol.valueOf(),
    eth: left.eth.valueOf() + right.eth.valueOf(),
    btc: left.btc.valueOf() + right.btc.valueOf(),
    srm: left.srm.valueOf() + right.srm.valueOf(),
    ray: left.ray.valueOf() + right.ray.valueOf(),
    ftt: left.ftt.valueOf() + right.ftt.valueOf(),
    hbb: left.hbb.valueOf() + right.hbb.valueOf(),
    msol: left.msol.valueOf() + right.msol.valueOf()
  }),

  sub: (
    left: Omit<HubbleTokenMap<BigInt>, "usdh">,
    right: Omit<HubbleTokenMap<BigInt>, "usdh">
  ): Omit<HubbleTokenMap<BigInt>, "usdh"> => ({
    sol: left.sol.valueOf() - right.sol.valueOf(),
    eth: left.eth.valueOf() - right.eth.valueOf(),
    btc: left.btc.valueOf() - right.btc.valueOf(),
    srm: left.srm.valueOf() - right.srm.valueOf(),
    ray: left.ray.valueOf() - right.ray.valueOf(),
    ftt: left.ftt.valueOf() - right.ftt.valueOf(),
    hbb: left.hbb.valueOf() - right.hbb.valueOf(),
    msol: left.msol.valueOf() - right.msol.valueOf()
  }),

  mul: (
    left: Omit<HubbleTokenMap<BigInt>, "usdh">,
    right: number
  ): Omit<HubbleTokenMap<BigInt>, "usdh"> => ({
    sol: left.sol.valueOf() * BigInt(right).valueOf(),
    eth: left.eth.valueOf() * BigInt(right).valueOf(),
    btc: left.btc.valueOf() * BigInt(right).valueOf(),
    srm: left.srm.valueOf() * BigInt(right).valueOf(),
    ray: left.ray.valueOf() * BigInt(right).valueOf(),
    ftt: left.ftt.valueOf() * BigInt(right).valueOf(),
    hbb: left.hbb.valueOf() * BigInt(right).valueOf(),
    msol: left.msol.valueOf() * BigInt(right).valueOf()
  }),

  div: (
    left: Omit<HubbleTokenMap<BigInt>, "usdh">,
    right: number | BigInt
  ): Omit<HubbleTokenMap<BigInt>, "usdh"> => {
    let divisor = BigInt(1);
    if (typeof right === "number") {
      divisor = BigInt(right).valueOf();
    } else if (typeof right === "bigint") {
      divisor = right.valueOf();
    }

    return {
      sol: left.sol.valueOf() / divisor,
      eth: left.eth.valueOf() / divisor,
      btc: left.btc.valueOf() / divisor,
      srm: left.srm.valueOf() / divisor,
      ray: left.ray.valueOf() / divisor,
      ftt: left.ftt.valueOf() / divisor,
      hbb: left.hbb.valueOf() / divisor,
      msol: left.msol.valueOf() / divisor
    };
  }
};
