import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AnchorProvider, web3 } from "@project-serum/anchor";

import { ActiveWalletService } from "./active-wallet.service";

@Injectable()
export class SolanaProviderService implements OnModuleInit {
  #logger = new Logger(SolanaProviderService.name);

  connection: web3.Connection;
  provider: AnchorProvider;

  constructor(
    private readonly config: ConfigService,
    private readonly activeWalletService: ActiveWalletService
  ) {}

  onModuleInit() {
    this.initializeConnection();
  }

  initializeConnection() {
    this.#logger.debug("Connecting to the Solana blockchain.");

    this.connection = new web3.Connection(this.config.get("solanaRpcUrl"));
    this.provider = new AnchorProvider(
      this.connection,
      this.activeWalletService.wallet,
      { commitment: "recent" }
    );
  }
}
