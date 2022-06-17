import { Injectable } from "@nestjs/common";
import { web3 } from "@project-serum/anchor";
import { Transaction, TransactionInstruction } from "@solana/web3.js";
import type BN from "bn.js";

import { TokenKind } from "../core/models";
import { ActiveWalletService } from "../shared/solana/active-wallet.service";
import { SolanaOperationsService } from "../shared/solana/solana-operations.service";
import { HubbleProgramService } from "./hubble-program.service";
import type {
  HarvestingCollateralValue,
  HubbleTokenMap,
  UserDepositSnapshot
} from "./models";
import { convertTokenMapValuesToBigInt } from "./utils/convertTokenMapValuesToBigInt";
import { convertTokenMapValuesToNumber } from "./utils/convertTokenMapValuesToNumber";
import { deserializeEpoch } from "./utils/deserializeEpoch";
import { getEpochScaleSum } from "./utils/getEpochScaleSum";
import { sumNumberTokenMaps } from "./utils/sumNumberTokenMaps";
import { tokenMapMath } from "./utils/tokenMapMath";

@Injectable()
export class StabilityPoolDataService {
  constructor(
    private readonly activeWalletService: ActiveWalletService,
    private readonly hubbleProgramService: HubbleProgramService,
    private readonly solanaOperationsService: SolanaOperationsService
  ) {}

  async buildHarvestStabilityPoolTokenGainsTransaction(
    tokenToHarvest: TokenKind
  ) {
    const activeWalletStabilityProviderState =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    // Build wSOL ATA instructions.
    const {
      ata: wsolAta,
      closeAtasIxns,
      createAtasIxns
    } = await this.solanaOperationsService.buildWsolAtaInstructions(
      this.activeWalletService.wallet.publicKey
    );

    // Prepare a HBB ATA helper.
    const hbbAtaHelper =
      await this.solanaOperationsService.findAtaWithCreateInstructionIfNotExists(
        this.activeWalletService.wallet.publicKey,
        new web3.PublicKey(this.solanaOperationsService.tokenMintAddresses.hbb)
      );
    const dependentIxns: TransactionInstruction[] = [];
    dependentIxns.push(...hbbAtaHelper.createAtaIxn);
    if (createAtasIxns.length > 0) {
      dependentIxns.push(...createAtasIxns);
    }

    // Build the dependent instructions for harvesting
    // the given token and build the final transaction.
    const harvestingCollateralValues =
      await this.buildRewardHarvestInstructions(
        tokenToHarvest.toUpperCase() as any,
        wsolAta
      );

    // Start building the transaction.
    const tx: Transaction = new Transaction();

    if (dependentIxns.length > 0) {
      tx.add(...dependentIxns);
    }

    for (const harvestingCollateralValue of harvestingCollateralValues) {
      const collateralHarvestInstructions =
        this.hubbleProgramService.getHarvestStabilityPoolGainsInstructions({
          owner: this.activeWalletService.wallet.publicKey,
          stabilityProviderState: activeWalletStabilityProviderState.publicKey,
          hbbAta: hbbAtaHelper.ata,
          liquidationRewardsVault:
            harvestingCollateralValue.liquidationRewardsVault,
          liquidationCoinAta: harvestingCollateralValue.collateralTokenAta,
          collateralTicker: harvestingCollateralValue.ticker
        });

      tx.add(...collateralHarvestInstructions);

      if (
        closeAtasIxns.length > 0 &&
        harvestingCollateralValue.ticker === "SOL"
      ) {
        tx.add(...closeAtasIxns);
      }
    }

    return tx;
  }

  async getActiveWalletPendingRewards() {
    const oldPendingRewards = await this.getActiveWalletPendingRewardsOld();
    const newPendingRewards = await this.getActiveWalletPendingRewardsNew();

    return sumNumberTokenMaps(oldPendingRewards, newPendingRewards);
  }

  private async buildRewardHarvestInstructions(
    ticker: Uppercase<TokenKind>,
    wsolAta: web3.PublicKey
  ) {
    // We can't directly harvest HBB rewards. We farm them by
    // indirectly attempting to farm SOL. The Hubble program
    // magically drops the HBB into our wallet.
    const modifiedTicker = ticker === "HBB" ? "SOL" : ticker;

    const harvestingCollateralValues: HarvestingCollateralValue[] = [];

    const tokenAtaHelper =
      await this.solanaOperationsService.findAtaWithCreateInstructionIfNotExists(
        this.activeWalletService.wallet.publicKey,
        new web3.PublicKey(
          this.solanaOperationsService.tokenMintAddresses[
            `${modifiedTicker.toLowerCase()}`
          ]
        )
      );

    harvestingCollateralValues.push({
      ticker: modifiedTicker,
      liquidationRewardsVaultAuthority: new web3.PublicKey(
        this.hubbleProgramService.publicKeys.liquidationRewardsVaultAuthority
      ),
      collateralTokenAta:
        modifiedTicker === "SOL" ? wsolAta : tokenAtaHelper.ata,
      liquidationRewardsVault: new web3.PublicKey(
        this.hubbleProgramService.publicKeys[
          `liquidationRewardsVault${modifiedTicker}`
        ]
      )
    });

    return harvestingCollateralValues;
  }

  private async getActiveWalletPendingRewardsOld() {
    const activeWalletStabilityProviderState =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    const rawPendingGains: HubbleTokenMap<BN> =
      activeWalletStabilityProviderState.account.pendingGainsPerUser;

    return convertTokenMapValuesToNumber(rawPendingGains);
  }

  private async getActiveWalletPendingRewardsNew() {
    const epochToScaleToSum =
      await this.hubbleProgramService.getEpochToScaleToSumAccount();

    const userDepositSnapshot = await this.getUserDepositSnapshot();

    const activeWalletStabilityProviderState =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    const computedResult = this.computeScaledEpochRewards({
      epochToScaleToSum,
      userDepositSnapshot,
      activeWalletStabilityProviderState
    });

    return convertTokenMapValuesToNumber(computedResult);
  }

  private computeScaledEpochRewards(options: {
    epochToScaleToSum: { data: BN[] };
    userDepositSnapshot: UserDepositSnapshot;
    activeWalletStabilityProviderState: any;
  }) {
    const SCALE_FACTOR = 1_000_000_000;
    const BIGINT_FACTOR = BigInt("1000000000000000");

    const {
      epochToScaleToSum,
      userDepositSnapshot,
      activeWalletStabilityProviderState
    } = options;

    const deserializedEpochToScaleToSum = deserializeEpoch(
      epochToScaleToSum.data
    );

    // We have to derive the rewards from the user's deposit snapshot.
    const {
      product: productSnapshot,
      epoch: epochSnapshot,
      scale: scaleSnapshot,
      sum: sumMap
    } = userDepositSnapshot;

    const sumMapAsBigInt = convertTokenMapValuesToBigInt(sumMap);

    const addendOne = tokenMapMath.sub(
      getEpochScaleSum(
        deserializedEpochToScaleToSum,
        epochSnapshot.toNumber(),
        scaleSnapshot.toNumber()
      ),
      sumMapAsBigInt
    );
    const addendTwo = tokenMapMath.div(
      getEpochScaleSum(
        deserializedEpochToScaleToSum,
        epochSnapshot.toNumber(),
        scaleSnapshot.toNumber() + 1
      ),
      SCALE_FACTOR
    );

    const computedResult = tokenMapMath.div(
      tokenMapMath.div(
        tokenMapMath.mul(
          tokenMapMath.add(addendOne, addendTwo),
          activeWalletStabilityProviderState.account.depositedStablecoin
        ),
        productSnapshot.toNumber()
      ),
      BIGINT_FACTOR
    );

    return computedResult as HubbleTokenMap<bigint>;
  }

  private async getUserDepositSnapshot() {
    const activeWalletStabilityProviderState =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    return activeWalletStabilityProviderState.account
      .userDepositSnapshot as UserDepositSnapshot;
  }
}
