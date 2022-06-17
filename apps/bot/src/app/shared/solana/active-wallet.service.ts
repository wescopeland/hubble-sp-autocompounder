import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Wallet, web3 } from "@project-serum/anchor";
import bs58 from "bs58";

@Injectable()
export class ActiveWalletService {
  #wallet: Wallet;
  #logger = new Logger(ActiveWalletService.name);

  get wallet() {
    if (!this.#wallet) {
      this.initializeActiveWallet();
    }

    return this.#wallet;
  }

  constructor(private readonly config: ConfigService) {}

  getActiveWalletKeypair(options: { reason: string }) {
    this.#logger.warn(
      `\`getActiveWalletKeypair\` was called. Reason: "${options.reason}".`
    );

    const walletPrivateKey = this.config.get("walletPrivateKey");
    return web3.Keypair.fromSecretKey(bs58.decode(walletPrivateKey));
  }

  private initializeActiveWallet() {
    this.#wallet = new Wallet(
      this.getActiveWalletKeypair({ reason: "Application bootup" })
    );
    this.#logger.log(
      `Initialized wallet with public key: ${this.#wallet.publicKey}.`
    );
  }
}
