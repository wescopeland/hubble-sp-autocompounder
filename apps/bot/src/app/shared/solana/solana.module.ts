import { Module } from "@nestjs/common";

import { ActiveWalletService } from "./active-wallet.service";
import { SolanaOperationsService } from "./solana-operations.service";
import { SolanaProviderService } from "./solana-provider.service";

@Module({
  providers: [
    ActiveWalletService,
    SolanaOperationsService,
    SolanaProviderService
  ],
  exports: [ActiveWalletService, SolanaOperationsService, SolanaProviderService]
})
export class SharedSolanaModule {}
