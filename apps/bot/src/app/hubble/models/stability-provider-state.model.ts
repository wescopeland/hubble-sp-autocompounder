import type { web3 } from "@project-serum/anchor";
import BN from "bn.js";

import type { HubbleTokenMap } from "./hubble-token-map.model";

export interface StabilityProviderState {
  publicKey: web3.PublicKey;
  account: {
    version: number;
    stabilityPoolState: web3.PublicKey;
    owner: web3.PublicKey;
    userId: BN;
    depositedStablecoin: BN;
    userDepositSnapshot: {
      sum: HubbleTokenMap<BN>;
      product: BN;
      scale: BN;
      epoch: BN;
      enabled: boolean;
    };
    cumulativeGainsPerUser: HubbleTokenMap<BN>;
    pendingGainsPerUser: HubbleTokenMap<BN>;
    padding: BN[];
  };
}
