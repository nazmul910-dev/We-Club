export interface ICreateInvictusCheckoutInput {
  paymentPlanId: string;
  discountCode?: string | undefined;
}

export interface ICreateInvictusCheckoutResult {
  checkoutUrl: string;
  sessionId: string;
}
