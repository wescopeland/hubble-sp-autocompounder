import { Module } from "@nestjs/common";

import { AppStateService } from "./app-state.service";

@Module({
  providers: [AppStateService],
  exports: [AppStateService]
})
export class AppStateModule {}
