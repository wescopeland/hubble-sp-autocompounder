import { PublicKey } from "@solana/web3.js";

import type { TokenKind } from "../../core/models";

export interface HarvestingCollateralValue {
  ticker: Uppercase<TokenKind>;
  collateralTokenAta: PublicKey;
  liquidationRewardsVault: PublicKey;
  liquidationRewardsVaultAuthority: PublicKey;
}
