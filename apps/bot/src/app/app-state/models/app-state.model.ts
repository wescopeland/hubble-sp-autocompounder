import type { HubbleTokenMap } from "@/hubble/models";

/**
 * We assume that every step that can be executed by the bot is
 * prone to failure. Having a global app state like this helps
 * us better keep track of whether we should spam the network
 * to get our tasks done (eg- selling liquidation rewards). These
 * transactions are more likely to fail during times of network
 * turbulence, so we want the bot to keep a good memory of when
 * we need to keep retrying certain operations.
 */
export interface AppState {
  pendingTokensForSale: Record<string, number>;

  /**
   * Claimed HBB rewards from the Hubble SP
   * that are waiting for the active wallet to sell/stake them.
   */
  hubbleClaimedSpFarmRewards: number;

  /**
   * Claimed liquidation rewards from the Hubble SP
   * that are waiting for the active wallet to sell/deposit them.
   */
  hubbleClaimedSpLiquidationRewards: Partial<
    Omit<HubbleTokenMap<BigInt>, "hbb" | "usdh">
  >;

  /**
   * Unclaimed HBB rewards in the Hubble SP
   * that are waiting for the active wallet to claim them.
   */
  hubblePendingSpFarmRewards: number;

  /**
   * Unclaimed liquidation rewards in the Hubble SP
   * that are waiting for the active wallet to claim them.
   */
  hubblePendingSpLiquidationRewards: Partial<
    Omit<HubbleTokenMap<BigInt>, "hbb" | "usdh">
  >;

  /**
   * Stablecoin in the wallet that has not yet been deposited or sent to
   * its final destination (Hubble SP, Saber LP, loan payment, etc).
   */
  idleStablecoinAmount: number;
}
