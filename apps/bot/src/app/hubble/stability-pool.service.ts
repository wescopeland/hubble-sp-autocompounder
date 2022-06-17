import { Injectable, Logger } from "@nestjs/common";
import { web3 } from "@project-serum/anchor";

import type { NumberReadability, TokenKind } from "../core/models";
import { formatTokenValue } from "../core/utils/formatTokenValue";
import { ActiveWalletService } from "../shared/solana/active-wallet.service";
import { SolanaOperationsService } from "../shared/solana/solana-operations.service";
import { SolanaProviderService } from "../shared/solana/solana-provider.service";
import { HubbleProgramService } from "./hubble-program.service";
import { StabilityPoolDataService } from "./stability-pool-data.service";
import { formatTokenMap } from "./utils/formatTokenMap";

@Injectable()
export class StabilityPoolService {
  #logger = new Logger(StabilityPoolService.name);

  constructor(
    private readonly hubbleProgramService: HubbleProgramService,
    private readonly dataService: StabilityPoolDataService,
    private readonly solanaProviderService: SolanaProviderService,
    private readonly solanaOperationsService: SolanaOperationsService,
    private readonly activeWalletService: ActiveWalletService
  ) {}

  /**
   * Builds and submits a transaction to deposit USDH
   * into the stability pool.
   *
   * @param humanReadableAmount The human-readable formatted input number.
   * @returns A Solana transaction ID.
   */
  async depositStablecoin(humanReadableAmount: number) {
    this.#logger.log(
      `Attempting to deposit ${humanReadableAmount} USDH into the stability pool.`
    );

    const { ata: usdhAtaPublicKey } =
      await this.solanaOperationsService.findAtaWithCreateInstructionIfNotExists(
        this.activeWalletService.wallet.publicKey,
        new web3.PublicKey(this.solanaOperationsService.tokenMintAddresses.usdh)
      );

    const { publicKey: stabilityProviderStatePublicKey } =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    return await this.hubbleProgramService.stabilityProvide(
      formatTokenValue("usdh", humanReadableAmount, "program"),
      {
        owner: this.activeWalletService.wallet.publicKey,
        stablecoinAta: usdhAtaPublicKey,
        stabilityProviderState: stabilityProviderStatePublicKey
      }
    );
  }

  /**
   * @returns
   * A human-readable number of the active wallet's deposited
   * stablecoin count in the Hubble Protocol stability pool.
   */
  async getDepositedStablecoinAmount(format: NumberReadability) {
    const activeWalletStabilityProviderState =
      await this.hubbleProgramService.getActiveWalletStabilityProviderState();

    const depositedStablecoinCount = formatTokenValue(
      "usdh",
      activeWalletStabilityProviderState.account.depositedStablecoin.toNumber(),
      format
    );

    this.#logger.log(
      `You have ${depositedStablecoinCount} USDH in the stability pool.`
    );

    return depositedStablecoinCount;
  }

  /**
   * @returns
   * A human-readable dictionary of the active wallet's
   * pending stability pool farming and liquidation rewards.
   */
  async getAllPendingRewardsAmount() {
    const pendingRewards =
      await this.dataService.getActiveWalletPendingRewards();

    const formatted = formatTokenMap(pendingRewards, "human");

    if (Object.keys(formatted).length === 0) {
      this.#logger.log("You have no pending stability pool rewards.");
    }

    for (const [tokenSymbol, tokenAmount] of Object.entries(formatted)) {
      this.#logger.log(
        `You have ${tokenAmount} ${tokenSymbol.toUpperCase()} in pending stability pool rewards.`
      );
    }

    return formatted;
  }

  /**
   * Builds and submits a transaction to harvest pending
   * stability gains for a given token kind.
   *
   * @returns A Solana transaction ID.
   */
  async harvestStabilityPoolGainsForToken(tokenToHarvest: TokenKind) {
    this.#logger.log(
      `Attempting to harvest stability pool ${tokenToHarvest.toUpperCase()} rewards.`
    );

    const constructedHarvestTransaction =
      await this.dataService.buildHarvestStabilityPoolTokenGainsTransaction(
        tokenToHarvest
      );

    return await this.solanaProviderService.provider.sendAndConfirm(
      constructedHarvestTransaction
    );
  }
}
