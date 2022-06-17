import { Jupiter } from "@jup-ag/core";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { web3 } from "@project-serum/anchor";

import { TokenKind } from "../../core/models";
import { formatTokenValue } from "../../core/utils/formatTokenValue";
import { ActiveWalletService } from "../solana/active-wallet.service";
import { SolanaOperationsService } from "../solana/solana-operations.service";
import { SolanaProviderService } from "../solana/solana-provider.service";
import { JupiterSwapResult } from "./models";

@Injectable()
export class TradingService {
  #logger = new Logger(TradingService.name);
  #jupiterClient: Jupiter;

  constructor(
    private readonly config: ConfigService,
    private readonly solanaProviderService: SolanaProviderService,
    private readonly solanaOperationsService: SolanaOperationsService,
    private readonly activeWalletService: ActiveWalletService
  ) {}

  async initializeClient() {
    this.#logger.debug("Connecting to Jupiter Aggregator.");

    this.#jupiterClient = await Jupiter.load({
      connection: this.solanaProviderService.connection,
      cluster: this.config.get("solanaCluster"),
      user: this.activeWalletService.getActiveWalletKeypair({
        reason: "jup.ag connection"
      })
    });

    this.#logger.debug(
      "Connected to Jupiter Aggregator. Ready to perform token swaps."
    );
  }

  /**
   * Creates a Jupiter swap transaction and posts it to the Solana blockchain.
   *
   * Be sure `inputHumanizedAmount` is the human-readable amount to be swapped,
   * ie- what would be entered in Jupiter's UI as the amount input.
   *
   * @returns The Jupiter API swap result.
   */
  async swap(options: {
    inputToken: TokenKind;
    inputHumanizedAmount: number;
    outputToken: TokenKind;
  }) {
    const { inputToken, inputHumanizedAmount, outputToken } = options;

    this.#logger.log(
      `Attempting to swap ${inputHumanizedAmount} ${inputToken.toUpperCase()} to ${outputToken.toUpperCase()}.`
    );

    const inputMintAddress =
      this.solanaOperationsService.tokenMintAddresses[inputToken];
    const outputMintAddress =
      this.solanaOperationsService.tokenMintAddresses[outputToken];

    const {
      routesInfos: [bestRoute]
    } = await this.#jupiterClient.computeRoutes({
      inputAmount: formatTokenValue(
        inputToken,
        inputHumanizedAmount,
        "program"
      ),
      inputMint: new web3.PublicKey(inputMintAddress),
      outputMint: new web3.PublicKey(outputMintAddress),
      slippage: 0.5,
      forceFetch: true
    });

    this.#logger.log(
      `Jupiter's best route is ${formatTokenValue(
        outputToken,
        bestRoute.outAmount,
        "human"
      )} ${outputToken.toUpperCase()} for ${inputHumanizedAmount} ${inputToken.toUpperCase()}.`
    );

    const { execute } = await this.#jupiterClient.exchange({
      routeInfo: bestRoute
    });

    const swapResult = (await execute()) as JupiterSwapResult;

    this.#logger.log(
      `Posted ${inputToken.toUpperCase()} to ${outputToken.toUpperCase()} swap transaction: https://solscan.io/tx/${
        swapResult.txid
      }`
    );
    return swapResult;
  }
}
