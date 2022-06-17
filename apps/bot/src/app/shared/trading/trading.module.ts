import { Module } from "@nestjs/common";

import { SharedSolanaModule } from "../solana/solana.module";
import { TradingService } from "./trading.service";

@Module({
  imports: [SharedSolanaModule],
  providers: [TradingService],
  exports: [TradingService]
})
export class SharedTradingModule {}
