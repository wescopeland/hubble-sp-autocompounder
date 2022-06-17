import type BN from "bn.js";

import type { HubbleTokenMap } from "./hubble-token-map.model";

export interface UserDepositSnapshot {
  sum: HubbleTokenMap<BN>;
  product: BN;
  scale: BN;
  epoch: BN;
  enabled: boolean;
}
