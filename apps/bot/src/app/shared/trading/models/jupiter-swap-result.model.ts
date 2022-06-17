import { web3 } from "@project-serum/anchor";

export interface JupiterSwapResult {
  txid: string;
  inputAddress: web3.PublicKey;
  outputAddress: web3.PublicKey;
  inputAmount: number | undefined;
  outputAmount: number | undefined;

  error?: any;
}
