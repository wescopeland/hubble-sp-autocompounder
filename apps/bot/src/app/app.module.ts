import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";

import { AppService } from "./app.service";
import { AppStateModule } from "./app-state/app-state.module";
import { configuration } from "./config/configuration";
import { HubbleModule } from "./hubble/hubble.module";
import { SharedSolanaModule } from "./shared/solana/solana.module";
import { SharedTradingModule } from "./shared/trading/trading.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration]
    }),
    ScheduleModule.forRoot(),
    AppStateModule,
    HubbleModule,
    SharedSolanaModule,
    SharedTradingModule
  ],
  providers: [AppService]
})
export class AppModule {}
