export const isWrappedSolAccountInfoValid = (wrappedSolAccountInfo: any) => {
  let isValid = true;

  if (
    wrappedSolAccountInfo === null ||
    (wrappedSolAccountInfo !== null &&
      wrappedSolAccountInfo?.data?.length === 0 &&
      wrappedSolAccountInfo?.owner?.toString() ===
        "11111111111111111111111111111111")
  ) {
    isValid = false;
  }

  return isValid;
};
