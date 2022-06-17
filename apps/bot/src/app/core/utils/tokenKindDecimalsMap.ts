import type { TokenKind } from "../models";

export const tokenKindDecimalsMap: Record<TokenKind, number> = {
  sol: 9,
  eth: 8,
  btc: 6,
  srm: 6,
  ray: 6,
  ftt: 6,
  msol: 9,
  hbb: 6,
  usdh: 6
};
