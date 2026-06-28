export const calculateCommissionAmount = (
  listingPriceAmount: number,
  commissionRatePercent: number
): number => {
  return Number(
    ((listingPriceAmount * commissionRatePercent) / 100).toFixed(2)
  );
};

export const calculatePlatformFeeAmount = (
  finalCommissionAmount: number,
  platformFeeRatePercent = 4.5
): number => {
  return Number(
    ((finalCommissionAmount * platformFeeRatePercent) / 100).toFixed(2)
  );
};