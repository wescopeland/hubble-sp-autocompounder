export const configuration = () => ({
  walletPrivateKey: process.env["WALLET_PRIVATE_KEY"],
  solanaCluster: process.env["SOLANA_CLUSTER"],
  solanaRpcUrl: process.env["SOLANA_RPC_URL"]
});
