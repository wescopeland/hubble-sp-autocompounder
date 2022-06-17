import { Module } from "@nestjs/common";

import { SharedSolanaModule } from "../shared/solana/solana.module";
import { HubbleProgramService } from "./hubble-program.service";
import { StabilityPoolService } from "./stability-pool.service";
import { StabilityPoolDataService } from "./stability-pool-data.service";

@Module({
  imports: [SharedSolanaModule],
  providers: [
    HubbleProgramService,
    StabilityPoolService,
    StabilityPoolDataService
  ],
  exports: [HubbleProgramService, StabilityPoolService]
})
export class HubbleModule {}
