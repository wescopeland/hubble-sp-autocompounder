import { Injectable } from "@nestjs/common";

import type { TokenKind } from "@/core/models";

import type { AppState } from "./models";

const initialAppState: AppState = {
  hubbleClaimedSpFarmRewards: 0,
  hubbleClaimedSpLiquidationRewards: {},
  hubblePendingSpFarmRewards: 0,
  hubblePendingSpLiquidationRewards: {},
  idleStablecoinAmount: 0,
  pendingTokensForSale: {}
};

@Injectable()
export class AppStateService {
  appState = initialAppState;

  clearPendingTokensForSale(tokenKind: TokenKind) {
    delete this.appState.pendingTokensForSale[tokenKind];
  }

  detectPendingHubbleFarmRewards(humanReadableHbbAmount: number) {
    this.appState = {
      ...this.appState,
      hubblePendingSpFarmRewards: humanReadableHbbAmount
    };
  }

  detectPendingHubbleLiquidationRewards(
    pendingLiquidationRewardsMap: AppState["hubblePendingSpLiquidationRewards"]
  ) {
    this.appState = {
      ...this.appState,
      hubblePendingSpLiquidationRewards: pendingLiquidationRewardsMap
    };
  }

  markLiquidationRewardAsClaimed(tokenKind: TokenKind, claimedAmount: number) {
    // Don't wipe out any idle claimed rewards. There could be mass
    // liquidations occurring but we haven't managed to sell yet.
    if (this.appState.hubbleClaimedSpLiquidationRewards[tokenKind]) {
      this.appState.hubbleClaimedSpLiquidationRewards[tokenKind] +=
        claimedAmount;
    } else {
      this.appState.hubbleClaimedSpLiquidationRewards[tokenKind] =
        claimedAmount;
    }

    delete this.appState.hubblePendingSpLiquidationRewards[tokenKind];
  }

  markFarmRewardAsClaimed(claimedAmount: number) {
    this.appState.hubbleClaimedSpFarmRewards = claimedAmount;
    this.appState.hubblePendingSpFarmRewards = 0;
  }

  addIdleStablecoin(stablecoinAmount: number) {
    this.appState.idleStablecoinAmount += stablecoinAmount;
  }

  reduceIdleStablecoin(stablecoinAmount: number) {
    this.appState.idleStablecoinAmount -= stablecoinAmount;
  }
}
