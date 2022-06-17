import type { OnModuleInit } from "@nestjs/common";
import { Injectable, Logger } from "@nestjs/common";
import { SchedulerRegistry } from "@nestjs/schedule";
import { CronJob } from "cron";

import { AppStateService } from "./app-state/app-state.service";
import { TokenKind } from "./core/models";
import { formatTokenValue } from "./core/utils/formatTokenValue";
import { HubbleProgramService } from "./hubble/hubble-program.service";
import { StabilityPoolService } from "./hubble/stability-pool.service";
import { SolanaProviderService } from "./shared/solana/solana-provider.service";
import { TradingService } from "./shared/trading/trading.service";

@Injectable()
export class AppService implements OnModuleInit {
  #logger = new Logger(AppService.name);

  constructor(
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly appStateService: AppStateService,
    private readonly solanaProviderService: SolanaProviderService,
    private readonly hubbleProgramService: HubbleProgramService,
    private readonly stabilityPoolService: StabilityPoolService,
    private readonly tradingService: TradingService
  ) {}

  async onModuleInit() {
    this.solanaProviderService.initializeConnection();
    this.hubbleProgramService.initializeProgram();
    await this.tradingService.initializeClient();

    this.startFrequentJob();

    this.harvestLiquidationRewards();
  }

  startFrequentJob() {
    // This job will run every 5 minutes during the day.
    const frequentCronExpression = "*/2 * * * *";

    const frequentJob = new CronJob(frequentCronExpression, async () => {
      try {
        // TODO
        this.harvestLiquidationRewards();
      } catch (error) {
        this.#logger.error("Problem running frequent tasks.", error);
      }
    });

    this.schedulerRegistry.addCronJob("Frequent", frequentJob);
    frequentJob.start();

    this.#logger.log("Started the Frequent job.");
  }

  private async harvestLiquidationRewards() {
    const pendingRewards =
      await this.stabilityPoolService.getAllPendingRewardsAmount();

    if (pendingRewards.hbb) {
      delete pendingRewards.hbb;
    }

    if (Object.keys(pendingRewards).length > 0) {
      this.#logger.log("🚨🚨🚨 There are pending liquidation rewards!");
    } else {
      this.#logger.log("No rewards yet.");
    }

    let accumulatedStablecoin = 0;

    for (const [
      pendingRewardTokenKind,
      pendingRewardTokenAmount
    ] of Object.entries(pendingRewards)) {
      // TODO: We want these two functions operating independently
      // of each other. This is because either one can fail due to
      // network instability.

      const harvestTxId =
        await this.stabilityPoolService.harvestStabilityPoolGainsForToken(
          pendingRewardTokenKind as TokenKind
        );
      this.#logger.log(
        `Posted ${pendingRewardTokenKind.toUpperCase()} rewards harvest transaction: https://solscan.io/tx/${harvestTxId}`
      );
      // TODO: Once gains are harvested, store them in a cache.

      const { outputAmount } = await this.tradingService.swap({
        inputToken: pendingRewardTokenKind as TokenKind,
        inputHumanizedAmount: Number(pendingRewardTokenAmount),
        outputToken: "usdh"
      });
      // TODO: Flush the cache of the reward.

      accumulatedStablecoin += formatTokenValue(
        pendingRewardTokenKind as TokenKind,
        outputAmount ?? 0,
        "human"
      );
    }

    if (accumulatedStablecoin > 0) {
      const stakeTxId = await this.stabilityPoolService.depositStablecoin(
        accumulatedStablecoin
      );
      this.#logger.log(
        `Posted ${accumulatedStablecoin} USDH deposit transaction: https://solscan.io/tx/${stakeTxId}`
      );
    }
  }
}
