import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { web3 } from "@project-serum/anchor";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  NATIVE_MINT,
  Token,
  TOKEN_PROGRAM_ID
} from "@solana/spl-token";
import { TransactionInstruction } from "@solana/web3.js";

import { AllowedSolanaCluster } from "../../core/models";
import { SolanaProviderService } from "./solana-provider.service";
import { solanaConfig } from "./solanaConfig";
import { isWrappedSolAccountInfoValid } from "./utils/isWrappedSolAccountInfoValid";

@Injectable()
export class SolanaOperationsService {
  tokenMintAddresses =
    solanaConfig.tokenMintAddresses[
      this.config.get<AllowedSolanaCluster>("solanaCluster")
    ];

  constructor(
    private readonly config: ConfigService,
    private readonly solanaProviderService: SolanaProviderService
  ) {}

  async buildWsolAtaInstructions(walletPublicKey: web3.PublicKey) {
    const createAtasIxns: TransactionInstruction[] = [];
    const closeAtasIxns: TransactionInstruction[] = [];

    const [wsolAta] = await web3.PublicKey.findProgramAddress(
      [
        walletPublicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        NATIVE_MINT.toBuffer()
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const wsolAtaAccountInfo =
      await this.solanaProviderService.connection.getAccountInfo(wsolAta);

    if (!isWrappedSolAccountInfoValid(wsolAtaAccountInfo)) {
      createAtasIxns.push(
        Token.createAssociatedTokenAccountInstruction(
          ASSOCIATED_TOKEN_PROGRAM_ID,
          TOKEN_PROGRAM_ID,
          NATIVE_MINT,
          wsolAta,
          walletPublicKey,
          walletPublicKey
        )
      );
    }

    if (createAtasIxns.length > 0) {
      createAtasIxns.push(
        new TransactionInstruction({
          keys: [{ pubkey: wsolAta, isSigner: false, isWritable: true }],
          data: Buffer.from(new Uint8Array([17])),
          programId: TOKEN_PROGRAM_ID
        })
      );
    }

    closeAtasIxns.push(
      Token.createCloseAccountInstruction(
        TOKEN_PROGRAM_ID,
        wsolAta,
        walletPublicKey,
        walletPublicKey,
        []
      )
    );

    return { createAtasIxns, closeAtasIxns, ata: wsolAta };
  }

  /**
   * This is pulled directly from hubble-webapp.
   */
  async findAtaWithCreateInstructionIfNotExists(
    walletPublicKey: web3.PublicKey,
    tokenMintAddress: web3.PublicKey
  ) {
    const [tokenMintAta] = await web3.PublicKey.findProgramAddress(
      [
        walletPublicKey.toBuffer(),
        TOKEN_PROGRAM_ID.toBuffer(),
        tokenMintAddress.toBuffer()
      ],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const tokenMintAtaAccount =
      await this.solanaProviderService.connection.getAccountInfo(tokenMintAta);

    const doesAccountExist = !!tokenMintAtaAccount;
    const createAtaIxn = doesAccountExist
      ? []
      : [
          Token.createAssociatedTokenAccountInstruction(
            ASSOCIATED_TOKEN_PROGRAM_ID,
            TOKEN_PROGRAM_ID,
            tokenMintAddress,
            tokenMintAta,
            walletPublicKey,
            walletPublicKey
          )
        ];

    return {
      createAtaIxn,
      ata: tokenMintAta
    };
  }
}
