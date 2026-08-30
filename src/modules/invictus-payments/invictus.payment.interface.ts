export interface ICreateInvictusCheckoutInput {
  paymentPlanId?: string | undefined;
  pillarId?: string | undefined;
  discountCode?: string | undefined;
}

export interface ICreateInvictusCheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}
