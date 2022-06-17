import type { TokenKind } from "../../core/models";

/**
 * Hubble often returns dictionaries of token values when
 * querying various on-chain data about a wallet.
 */
export type HubbleTokenMap<T> = Record<TokenKind, T>;
