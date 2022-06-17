import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { type Idl, Program, web3 } from "@project-serum/anchor";
import { TOKEN_PROGRAM_ID } from "@solana/spl-token";
import BN from "bn.js";

import type { AllowedSolanaCluster, TokenKind } from "../core/models";
import { formatTokenValue } from "../core/utils/formatTokenValue";
import { ActiveWalletService } from "../shared/solana/active-wallet.service";
import { SolanaProviderService } from "../shared/solana/solana-provider.service";
import BorrowingIdl from "./borrowing.json";
import { hubbleConfig } from "./hubbleConfig";
import type { StabilityProviderState } from "./models";

@Injectable()
export class HubbleProgramService {
  publicKeys =
    hubbleConfig.publicKeys[
      this.config.get<AllowedSolanaCluster>("solanaCluster")
    ];
  #logger = new Logger(HubbleProgramService.name);
  #hubbleBorrowingProgram: Program<any>;

  constructor(
    private readonly config: ConfigService,
    private readonly activeWalletService: ActiveWalletService,
    private readonly solanaProviderService: SolanaProviderService
  ) {}

  getAllStabilityProviderStates() {
    this.#logger.debug(
      "Fetching stability provider state of all stability providers."
    );

    return this.#hubbleBorrowingProgram.account.stabilityProviderState.all() as Promise<
      StabilityProviderState[]
    >;
  }

  async getActiveWalletStabilityProviderState() {
    const allProviderStates = await this.getAllStabilityProviderStates();

    const activeWalletPublicKey = this.activeWalletService.wallet.publicKey;
    return allProviderStates.find(
      (providerState) =>
        providerState.account.owner.toString() ===
        activeWalletPublicKey.toString()
    );
  }

  getEpochToScaleToSumAccount() {
    this.#logger.debug("Fetching epoch to scale to sum account.");

    return this.#hubbleBorrowingProgram.account.epochToScaleToSumAccount.fetch(
      this.publicKeys.epochToScaleToSum
    ) as Promise<{ data: BN[] }>;
  }

  getHarvestStabilityPoolGainsInstructions(options: {
    owner: web3.PublicKey;
    stabilityProviderState: web3.PublicKey;
    hbbAta: web3.PublicKey;
    liquidationRewardsVault: web3.PublicKey;
    liquidationCoinAta: web3.PublicKey;
    collateralTicker: Uppercase<TokenKind>;
  }) {
    const stabilityKeyForTickerMap = {
      SOL: 0,
      ETH: 1,
      BTC: 2,
      SRM: 3,
      RAY: 4,
      FTT: 5,
      MSOL: 7
    };

    const tx = this.#hubbleBorrowingProgram.transaction.harvestLiquidationGains(
      new BN(stabilityKeyForTickerMap?.[options.collateralTicker] ?? 0),
      {
        accounts: {
          owner: options.owner,
          stabilityProviderState: options.stabilityProviderState,
          borrowingMarketState: new web3.PublicKey(
            this.publicKeys.borrowingMarketState
          ),
          globalConfig: new web3.PublicKey(this.publicKeys.globalConfig),
          borrowingVaults: new web3.PublicKey(this.publicKeys.borrowingVaults),
          stabilityPoolState: new web3.PublicKey(
            this.publicKeys.stabilityPoolState
          ),
          liquidationsQueue: new web3.PublicKey(
            this.publicKeys.liquidationsQueue
          ),
          epochToScaleToSum: new web3.PublicKey(
            this.publicKeys.epochToScaleToSum
          ),
          liquidationRewardsVault: options.liquidationRewardsVault,
          liquidationRewardsVaultAuthority: new web3.PublicKey(
            this.publicKeys.liquidationRewardsVaultAuthority
          ),
          liquidationRewardsTo: options.liquidationCoinAta,
          hbbAta: options.hbbAta,
          hbbMint: new web3.PublicKey(this.publicKeys.hbbMint),
          hbbMintAuthority: new web3.PublicKey(
            this.publicKeys.hbbMintAuthority
          ),
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: web3.SYSVAR_CLOCK_PUBKEY
        }
      }
    );

    return tx.instructions;
  }

  initializeProgram() {
    this.#hubbleBorrowingProgram = new Program(
      BorrowingIdl as Idl,
      new web3.PublicKey(this.publicKeys.borrowingProgram),
      this.solanaProviderService.provider
    );
  }

  stabilityProvide(
    programReadableAmount: number,
    accounts: {
      owner: web3.PublicKey;
      stablecoinAta: web3.PublicKey;
      stabilityProviderState: web3.PublicKey;
    }
  ) {
    return this.#hubbleBorrowingProgram.rpc.stabilityProvide(
      new BN(programReadableAmount),
      {
        accounts: {
          ...accounts,
          borrowingMarketState: new web3.PublicKey(
            this.publicKeys.borrowingMarketState
          ),
          borrowingVaults: new web3.PublicKey(this.publicKeys.borrowingVaults),
          stabilityPoolState: new web3.PublicKey(
            this.publicKeys.stabilityPoolState
          ),
          epochToScaleToSum: new web3.PublicKey(
            this.publicKeys.epochToScaleToSum
          ),
          stablecoinStabilityPoolVault: new web3.PublicKey(
            this.publicKeys.stablecoinStabilityPoolVault
          ),
          globalConfig: new web3.PublicKey(this.publicKeys.globalConfig),
          tokenProgram: TOKEN_PROGRAM_ID,
          clock: web3.SYSVAR_CLOCK_PUBKEY
        }
      }
    );
  }
}
