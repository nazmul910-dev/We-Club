import Stripe from "stripe";
import config from "../../config";
import { sendCalendlyMeetingMail } from "../../utility/sendCalendlyMeeting";
import { User } from "../users/users.model.schema";
import {
  UserRole,
  AccessTo,
  MembershipDurationMonths,
} from "../users/user.interface";
import { PaymentSession } from "./payment.model.schema";
import { discountService } from "../discount/discount.service";

import {
  applyDiscountToPricingPlan,
  getAllPricingPlans,
  getPricingByRoleAndAccess,
  isPaidRole,
} from "./payment.pricing";

import { RegistrationPaymentLink } from "./registrationPaymentLink.model";

import assertFound from "../../utility/assertFound";
import { syncMembershipExpiry } from "../../utility/membership/membership.service";
import { sendRegistrationPaymentLinkMail } from "../../utility/sendRegistrationPaymentLinkMail ";
import { invictusPaymentService } from "../invictus-payments/invictus.payment.service";

const stripeSecretKey = config.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

const stripUndefined = <T extends Record<string, unknown>>(obj: T): T => {
  const result = {} as T;
  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const getStripeClient = (): Stripe => {
  const stripeClient = stripe as Stripe | null;

  if (!stripeClient) {
    throwError("Stripe is not configured. Please set STRIPE_SECRET_KEY.", 500);
  }

  return stripeClient as Stripe;
};

type CheckoutPurpose = "registration" | "upgrade";

type CreateCheckoutPayload = {
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  accessTo: AccessTo;
  purpose: CheckoutPurpose;
  discountCode?: string | undefined;
  stripeCustomerId?: string | undefined;
};

const getPricingPlanByRoleAndAccess = (role: UserRole, accessTo: AccessTo) => {
  return getPricingByRoleAndAccess(role, accessTo);
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);

  result.setUTCMonth(result.getUTCMonth() + months);

  return result;
};

const createCheckoutSession = async ({
  userId,
  fullName,
  email,
  role,
  accessTo,
  purpose,
  discountCode,
  stripeCustomerId,
}: CreateCheckoutPayload) => {
  if (!isPaidRole(role)) {
    throwError("This role does not require Stripe payment", 400);
  }

  const originalPricingPlan = getPricingByRoleAndAccess(role, accessTo);

  if (
    !originalPricingPlan.requiresPayment ||
    originalPricingPlan.items.length === 0
  ) {
    throwError("No pricing configured for this role and access type", 500);
  }

  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role,
    accessTo,
    userId,
  });

  const finalPricingPlan = discount
    ? applyDiscountToPricingPlan(originalPricingPlan, discount.discountPercent)
    : originalPricingPlan;

  const sessionCreateParams: Record<string, unknown> = {
    mode: "subscription",

    line_items: finalPricingPlan.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: item.currency,
        unit_amount: item.amountCents,
        recurring: {
          interval: item.interval,
        },
        product_data: {
          name: item.name,
          description: item.description,
        },
      },
    })),

    allow_promotion_codes: false,

    success_url: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/payment/cancel`,

    metadata: {
      userId,
      role,
      accessTo,
      purpose,
      fullName,
      email,
      originalAmountCents: String(originalPricingPlan.totalFirstPaymentCents),
      finalAmountCents: String(finalPricingPlan.totalFirstPaymentCents),
      discountCode: discount?.code || "",
      discountPercent: String(discount?.discountPercent || 0),
    },

    subscription_data: {
      metadata: {
        userId,
        role,
        accessTo,
        purpose,
        discountCode: discount?.code || "",
        discountPercent: String(discount?.discountPercent || 0),
      },
    },
  };

  if (stripeCustomerId) {
    sessionCreateParams.customer = stripeCustomerId;
  } else {
    sessionCreateParams.customer_email = email;
  }

  const stripeClient = getStripeClient();

  const session = await stripeClient.checkout.sessions.create(
    sessionCreateParams as any,
  );

  if (!session.url) {
    throwError("Failed to create Stripe Checkout session", 500);
  }

  await PaymentSession.create(
    stripUndefined({
      user: userId,
      role,
      accessTo,
      purpose,
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
      checkoutUrl: session.url ?? undefined,
      amountTotal: finalPricingPlan.totalFirstPaymentCents,
      originalAmountTotal: originalPricingPlan.totalFirstPaymentCents,
      discountAmountTotal:
        originalPricingPlan.totalFirstPaymentCents -
        finalPricingPlan.totalFirstPaymentCents,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      currency: "usd",
    }) as any,
  );

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        stripeCheckoutSessionId: session.id,
        subscriptionStatus: "incomplete",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );

  return {
    checkoutUrl: session.url ?? null,
    sessionId: session.id,
    pricing: finalPricingPlan,
    originalPricing: originalPricingPlan,
    discount,
  };
};

const getRegistrationPaymentDetails = async (token: string) => {
  const paymentLink = await RegistrationPaymentLink.findOne({
    token,
    status: {
      $in: ["active", "checkout_created"],
    },
  });

  if (!paymentLink) {
    throwError("Payment link is invalid or expired", 404);
  }

  const user = await User.findById(paymentLink!.user).select(
    "fullName email role accessTo membershipDurationMonths paymentStatus subscriptionStatus approvalStatus accountStatus",
  );
  assertFound(user, "User not found", 404);

  if (!user) {
    throwError("User not found", 404);
  }

  assertFound(user, "User not found", 404);

  if (user.paymentStatus === "paid") {
    return {
      alreadyPaid: true,

      user: {
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        accessTo: user.accessTo,
        durationMonths: user.membershipDurationMonths,
      },

      paymentStatus: user.paymentStatus,

      message: "Payment has already been completed.",
    };
  }

  if (!user.membershipDurationMonths) {
    throwError("Membership duration is missing", 400);
  }

  const pricing = getPricingByRoleAndAccess(
    user.role,
    user.accessTo,
    user.membershipDurationMonths as MembershipDurationMonths,
  );

  return {
    alreadyPaid: false,

    user: {
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo,

      durationMonths: user.membershipDurationMonths,
    },

    pricing,

    paymentStatus: user.paymentStatus,
  };
};

const createRegistrationCheckoutByToken = async (
  token: string,
  discountCode?: string,
) => {
  const paymentLink = await RegistrationPaymentLink.findOne({
    token,

    status: {
      $in: ["active", "checkout_created"],
    },
  });

  if (!paymentLink) {
    throwError("Invalid or expired payment link", 404);
  }

  const user = await User.findById(paymentLink!.user).select("-password");

  if (!user) {
    throwError("User not found", 404);
  }

  assertFound(user, "User not found", 404);

  if (user.paymentStatus === "paid") {
    throwError("Payment has already been completed", 400);
  }

  if (!user.membershipDurationMonths) {
    throwError("Membership duration is missing", 400);
  }

  const durationMonths =
    user.membershipDurationMonths as MembershipDurationMonths;

  const originalPricing = getPricingByRoleAndAccess(
    user.role,
    user.accessTo,
    durationMonths,
  );

  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,

    role: user.role,

    accessTo: user.accessTo,

    userId: String(user._id),
  });

  const finalPricing = discount
    ? applyDiscountToPricingPlan(originalPricing, discount.discountPercent)
    : originalPricing;

  const stripeClient = getStripeClient();

  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",

    customer_email: user.email,

    client_reference_id: String(user._id),

    line_items: finalPricing.items.map((item) => ({
      quantity: 1,

      price_data: {
        currency: item.currency,

        unit_amount: item.amountCents,

        product_data: {
          name: item.name,

          description: item.description,
        },
      },
    })),

    success_url: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

    cancel_url: `${config.FRONTEND_URL}/payment/registration/${token}`,

    metadata: {
      userId: String(user._id),

      role: user.role,

      accessTo: user.accessTo,

      purpose: "registration",

      durationMonths: String(durationMonths),

      paymentLinkId: String(paymentLink!._id),

      originalAmountCents: String(originalPricing.totalFirstPaymentCents),

      finalAmountCents: String(finalPricing.totalFirstPaymentCents),

      discountCode: discount?.code || "",

      discountPercent: String(discount?.discountPercent || 0),
    },
  });

  if (!session.url) {
    throwError("Stripe checkout URL was not created", 500);
  }

  await PaymentSession.create({
    user: user._id,

    role: user.role,

    accessTo: user.accessTo,

    durationMonths,

    purpose: "registration",

    status: "pending",

    stripeCheckoutSessionId: session.id,

    checkoutUrl: session.url,

    amountTotal: finalPricing.totalFirstPaymentCents,

    originalAmountTotal: originalPricing.totalFirstPaymentCents,

    discountAmountTotal:
      originalPricing.totalFirstPaymentCents -
      finalPricing.totalFirstPaymentCents,

    discountCode: discount?.code,

    discountPercent: discount?.discountPercent,

    currency: "usd",
  } as any);

  await RegistrationPaymentLink.findByIdAndUpdate(paymentLink!._id, {
    $set: {
      status: "checkout_created",

      stripeCheckoutSessionId: session.id,
    },
  });

  await User.findByIdAndUpdate(user._id, {
    $set: {
      stripeCheckoutSessionId: session.id,

      subscriptionStatus: "incomplete",
    },
  });

  return {
    checkoutUrl: session.url,

    sessionId: session.id,

    user: {
      fullName: user.fullName,

      email: user.email,

      role: user.role,

      accessTo: user.accessTo,

      durationMonths,
    },

    originalPricing,

    pricing: finalPricing,

    discount,
  };
};

const getPendingRegistrationPayments = async () => {
  const links = await RegistrationPaymentLink.find({
    status: {
      $in: ["active", "checkout_created"],
    },
  })

    .populate({
      path: "user",

      select:
        "fullName email phone city country brokerage role accessTo membershipDurationMonths paymentStatus subscriptionStatus approvalStatus accountStatus createdAt",
    })

    .sort({
      createdAt: -1,
    })

    .lean();

  return links
    .filter((link) => link.user)
    .map((link) => ({
      ...link,

      paymentLink: `${config.FRONTEND_URL}/payment/registration/${link.token}`,
    }));
};

const createUpgradeCheckoutSessionIntoStripe = async (
  userId: string,
  durationMonths: MembershipDurationMonths,
  discountCode?: string,
) => {
  const user = await User.findById(userId).select("-password");

  if (!user) {
    throwError("User not found", 404);
  }

  const currentUser = user!;

  // Upgrade only after expiry
  if (currentUser.membershipAccessStatus !== "expired") {
    throwError("Your current membership is still active.", 400);
  }

  if (
    currentUser.approvalStatus !== "approved" ||
    currentUser.accountStatus !== "active"
  ) {
    throwError("Your account is not eligible for membership renewal.", 403);
  }

  let resolvedDuration: MembershipDurationMonths = durationMonths;

  // CEO / CEO Partner always 12 months
  if (currentUser.role === "ceo" || currentUser.role === "ceo_partner") {
    resolvedDuration = 12;
  }

  const originalPricing = getPricingByRoleAndAccess(
    currentUser.role,
    currentUser.accessTo,
    resolvedDuration,
  );

  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role: currentUser.role,
    accessTo: currentUser.accessTo,
    userId: String(currentUser._id),
  });

  const finalPricing = discount
    ? applyDiscountToPricingPlan(originalPricing, discount.discountPercent)
    : originalPricing;

  const stripeClient = getStripeClient();

  const session = await stripeClient.checkout.sessions.create({
    mode: "payment",

    customer: currentUser.stripeCustomerId || undefined,
    customer_email: currentUser.stripeCustomerId
      ? undefined
      : currentUser.email,

    client_reference_id: String(currentUser._id),

    line_items: finalPricing.items.map((item) => ({
      quantity: 1,
      price_data: {
        currency: item.currency,
        unit_amount: item.amountCents,
        product_data: {
          name: item.name,
          description: `${resolvedDuration} month membership renewal`,
        },
      },
    })),

    success_url: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/upgrade-plan`,

    metadata: {
      userId: String(currentUser._id),
      role: currentUser.role,
      accessTo: currentUser.accessTo,
      purpose: "upgrade",
      durationMonths: String(resolvedDuration),
      originalAmountCents: String(originalPricing.totalFirstPaymentCents),
      finalAmountCents: String(finalPricing.totalFirstPaymentCents),
      discountCode: discount?.code || "",
      discountPercent: String(discount?.discountPercent ?? 0),
    },
  } as any);

  if (!session.url) {
    throwError("Stripe Checkout session could not be created.", 500);
  }

  await PaymentSession.create(
    stripUndefined({
      user: currentUser._id,
      role: currentUser.role,
      accessTo: currentUser.accessTo,
      durationMonths: resolvedDuration,
      purpose: "upgrade",
      status: "pending",
      stripeCheckoutSessionId: session.id,
      checkoutUrl: session.url ?? undefined,
      amountTotal: finalPricing.totalFirstPaymentCents,
      originalAmountTotal: originalPricing.totalFirstPaymentCents,
      discountAmountTotal:
        originalPricing.totalFirstPaymentCents -
        finalPricing.totalFirstPaymentCents,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      currency: "usd",
    }) as any,
  );

  await User.findByIdAndUpdate(currentUser._id, {
    $set: {
      stripeCheckoutSessionId: session.id,
      subscriptionStatus: "incomplete",
    },
  });

  return {
    checkoutUrl: session.url ?? null,
    sessionId: session.id,
    role: currentUser.role,
    accessTo: currentUser.accessTo,
    durationMonths: resolvedDuration,
    pricing: finalPricing,
    originalPricing,
    discount,
  };
};

const getSubscriptionPeriodEnd = (
  subscription: Stripe.Subscription,
): Date | undefined => {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };

  if (!subscriptionWithPeriod.current_period_end) {
    return undefined;
  }

  return new Date(subscriptionWithPeriod.current_period_end * 1000);
};

const activateRegistrationPayment = async (
  session: Stripe.Checkout.Session,
) => {
  const userId = session.metadata?.userId;

  const durationMonths = Number(
    session.metadata?.durationMonths,
  ) as MembershipDurationMonths;

  const discountCode = session.metadata?.discountCode || undefined;

  if (!userId || ![3, 6, 12].includes(durationMonths)) {
    throwError("Invalid Stripe payment metadata", 400);
  }

  const paymentSession = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id,
  });

  if (paymentSession?.status === "paid") {
    return User.findById(paymentSession.user);
  }

  const existingUser = await User.findById(userId);

  if (!existingUser) {
    throwError("User not found", 404);
  }

  const now = new Date();

  const expiresAt = addMonths(now, durationMonths);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const accountStatus =
    existingUser!.approvalStatus === "approved" ? "active" : "pending_approval";

  const updatePayload: Record<string, unknown> = {
    paymentStatus: "paid",

    subscriptionStatus: "active",

    accountStatus,

    subscriptionStartAt: now,

    subscriptionExpiresAt: expiresAt,

    stripeCheckoutSessionId: session.id,
  };

  if (customerId) {
    updatePayload.stripeCustomerId = customerId;
  }

  const user = await User.findByIdAndUpdate(
    userId as string,
    {
      $set: updatePayload,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id,
    },
    {
      $set: {
        status: "paid",

        amountTotal: session.amount_total ?? undefined,

        currency: session.currency ?? "usd",
      },
    },
  );

  await RegistrationPaymentLink.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id,
    },
    {
      $set: {
        status: "paid",

        paidAt: new Date(),
      },
    },
  );

  if (discountCode) {
    try {
      await discountService.redeemDiscountCodeAfterPayment({
        code: discountCode,
        userId: userId as string,
        role: existingUser!.role,
        accessTo: existingUser!.accessTo,
        stripeCheckoutSessionId: session.id,
      });
    } catch (error) {

      console.error(
        `[DISCOUNT REDEEM FAILED] session=${session.id} code=${discountCode} userId=${userId}:`,
        error,
      );
    }
  }

  return user;
};

const activateUpgradePayment = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;

  const durationMonths = Number(
    session.metadata?.durationMonths,
  ) as MembershipDurationMonths;

  const discountCode = session.metadata?.discountCode || undefined;

  if (!userId) {
    throwError("User ID missing from payment metadata.", 400);
  }

  if (![3, 6, 12].includes(durationMonths)) {
    throwError("Invalid membership duration.", 400);
  }

  const existingPayment = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id,
  });

  if (existingPayment?.status === "paid") {
    return User.findById(userId);
  }

  const user = await User.findById(userId);

  assertFound(user, "User not found.", 404);

  const now = new Date();
  const expiresAt = addMonths(now, durationMonths);

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id;

  const updatePayload: Record<string, unknown> = {
    membershipDurationMonths: durationMonths,
    membershipAccessStatus: "active",
    paymentStatus: "paid",
    subscriptionStatus: "active",
    subscriptionStartAt: now,
    subscriptionExpiresAt: expiresAt,
  };

  if (customerId) {
    updatePayload.stripeCustomerId = customerId;
  }

  await User.findByIdAndUpdate(
    userId,
    {
      $set: updatePayload,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id,
    },
    {
      $set: {
        status: "paid",
        amountTotal: session.amount_total ?? undefined,
        currency: session.currency ?? "usd",
      },
    },
  );

  if (discountCode) {
    try {
      await discountService.redeemDiscountCodeAfterPayment({
        code: discountCode,
        userId: userId as string,
        role: user.role,
        accessTo: user.accessTo,
        stripeCheckoutSessionId: session.id,
      });
    } catch (error) {
      console.error(
        `[DISCOUNT REDEEM FAILED] session=${session.id} code=${discountCode} userId=${userId}:`,
        error,
      );
    }
  }

  return User.findById(userId);
};

const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const existingPayment = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id,
  });

  if (existingPayment?.status === "paid") {
    return;
  }

  const purpose = session.metadata?.purpose as CheckoutPurpose | undefined;

  if (purpose === "registration") {
    await activateRegistrationPayment(session);
    return;
  }

  if (purpose === "upgrade") {
    await activateUpgradePayment(session);
    return;
  }

  throwError("Stripe session purpose is missing or invalid", 400);
};

const getInvoiceSubscriptionId = (
  invoice: Stripe.Invoice,
): string | undefined => {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  if (typeof invoiceWithSubscription.subscription === "string") {
    return invoiceWithSubscription.subscription;
  }

  return invoiceWithSubscription.subscription?.id;
};

const getInvoiceCustomerId = (invoice: Stripe.Invoice): string | undefined => {
  if (typeof invoice.customer === "string") {
    return invoice.customer;
  }

  return invoice.customer?.id;
};

const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
  const subscriptionId = getInvoiceSubscriptionId(invoice);
  const customerId = getInvoiceCustomerId(invoice);

  if (!subscriptionId) {
    return;
  }

  const stripeClient = getStripeClient();
  const subscription =
    await stripeClient.subscriptions.retrieve(subscriptionId);
  const subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);

  const setPayload: Record<string, unknown> = {
    paymentStatus: "paid",
    subscriptionStatus: "active",
    stripeSubscriptionId: subscriptionId,
  };

  if (customerId) {
    setPayload.stripeCustomerId = customerId;
  }

  if (subscriptionExpiresAt) {
    setPayload.subscriptionExpiresAt = subscriptionExpiresAt;
  }

  await User.findOneAndUpdate(
    {
      $or: [
        { stripeSubscriptionId: subscriptionId },
        ...(customerId ? [{ stripeCustomerId: customerId }] : []),
      ],
    },
    {
      $set: setPayload,
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
};

const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const subscriptionId = getInvoiceSubscriptionId(invoice);

  if (!subscriptionId) {
    return;
  }

  await User.findOneAndUpdate(
    {
      stripeSubscriptionId: subscriptionId,
    },
    {
      $set: {
        paymentStatus: "failed",
        subscriptionStatus: "past_due",
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
};

const handleSubscriptionDeletedOrExpired = async (
  subscription: Stripe.Subscription,
) => {
  await User.findOneAndUpdate(
    {
      stripeSubscriptionId: subscription.id,
    },
    {
      $set: {
        paymentStatus: "expired",
        subscriptionStatus: "expired",
        subscriptionExpiresAt: new Date(),
      },
    },
    {
      returnDocument: "after",
      runValidators: true,
    },
  );
};

const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string | string[] | undefined,
) => {
  const stripeSignatureValue = Array.isArray(signature)
    ? signature[0]
    : signature;

  if (
    typeof stripeSignatureValue !== "string" ||
    !stripeSignatureValue.trim()
  ) {
    throwError("Stripe signature is missing", 400);
  }

  const webhookSecret = config.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throwError("Stripe webhook secret is missing", 500);
  }

  const stripeClient = getStripeClient();

  let webhookEvent: Stripe.Event;

  try {
    webhookEvent = stripeClient.webhooks.constructEvent(
      rawBody,
      stripeSignatureValue as string,
      webhookSecret as string,
    );
  } catch (error) {
    console.error(
      "Stripe webhook signature verification failed:",
      error instanceof Error ? error.message : error,
    );
    return throwError("Invalid Stripe webhook signature", 400);
  }

  switch (webhookEvent.type) {
    case "checkout.session.completed": {
      const session = webhookEvent.data.object as Stripe.Checkout.Session;

      if (session.payment_status !== "paid") {
        console.log(
          `Stripe checkout ${session.id} completed but payment status is ${session.payment_status}`,
        );
        break;
      }

      const purpose = session.metadata?.purpose;

      if (!purpose) {
        console.error(
          `Stripe checkout ${session.id} has no payment purpose in metadata`,
        );
        break;
      }
      if (purpose === "invictus_purchase") {
        await invictusPaymentService.activateInvictusPurchase(session);
        break;
      }

      if (purpose === "registration") {
        await activateRegistrationPayment(session);
        break;
      }

      if (purpose === "upgrade") {
        await activateUpgradePayment(session);
        break;
      }

      console.warn(
        `Unknown Stripe checkout purpose "${purpose}" for session ${session.id}`,
      );
      break;
    }

    case "invoice.paid":
      await handleInvoicePaid(webhookEvent.data.object as Stripe.Invoice);
      break;

    case "invoice.payment_failed":
      await handleInvoicePaymentFailed(
        webhookEvent.data.object as Stripe.Invoice,
      );
      break;

    case "customer.subscription.deleted":
      await handleSubscriptionDeletedOrExpired(
        webhookEvent.data.object as Stripe.Subscription,
      );
      break;

    default: {
      console.log(`Unhandled Stripe webhook event: ${webhookEvent.type}`);
      break;
    }
  }
};

const verifyCheckoutSessionFromStripe = async (sessionId: string) => {
  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return { paid: false, message: 'Payment is not completed yet' };
  }

  const purpose = session.metadata?.purpose;

  if (purpose === 'upgrade') {
    await activateUpgradePayment(session);
  } else if (purpose === 'invictus_purchase') {
    await invictusPaymentService.activateInvictusPurchase(session);
  } else {
    await activateRegistrationPayment(session);
  }

  return { paid: true, message: 'Payment verified successfully' };
};


const getMyUpgradePlans = async (userId: string) => {
  await syncMembershipExpiry(userId);

  const user = await User.findById(userId).select(
    "role accessTo membershipAccessStatus subscriptionExpiresAt",
  );

  if (!user) {
    throwError("User not found", 404);
  }

  assertFound(user, "User not found", 404);

  if (user.membershipAccessStatus !== "expired") {
    throwError(
      "Upgrade plans are only available after membership expiry.",
      400,
    );
  }

  const durations: MembershipDurationMonths[] =
    user.role === "ceo" || user.role === "ceo_partner" ? [12] : [3, 6, 12];

  const plans = durations.map((durationMonths) => ({
    durationMonths,

    pricing: getPricingByRoleAndAccess(
      user.role,
      user.accessTo,
      durationMonths,
    ),
  }));

  return {
    role: user.role,

    accessTo: user.accessTo,

    membershipAccessStatus: user.membershipAccessStatus,

    expiredAt: user.subscriptionExpiresAt,

    plans,
  };
};

const sendRegistrationPaymentLinkEmail = async (paymentLinkId: string) => {
  const paymentLink = await RegistrationPaymentLink.findById(
    paymentLinkId,
  ).populate({
    path: "user",
    select: "fullName email role",
  });

  if (!paymentLink) {
    throwError("Payment link not found", 404);
  }

  const currentPaymentLink = paymentLink!;

  if (!["active", "checkout_created"].includes(currentPaymentLink.status)) {
    throwError(
      "This payment link is no longer active (already paid or revoked).",
      400,
    );
  }

  const user = currentPaymentLink.user as any;

  if (!user) {
    throwError("User not found for this payment link", 404);
  }

  const paymentUrl = `${config.FRONTEND_URL}/payment/registration/${currentPaymentLink.token}`;

  await sendRegistrationPaymentLinkMail({
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    paymentLink: paymentUrl,
  });

  return {
    sent: true,
    email: user.email,
    paymentLink: paymentUrl,
  };
};

export const paymentService = {
  getAllPricingPlans,
  getPricingPlanByRoleAndAccess,
  createCheckoutSession,
  createUpgradeCheckoutSessionIntoStripe,
  handleStripeWebhook,
  verifyCheckoutSessionFromStripe,

  getMyUpgradePlans,
  getRegistrationPaymentDetails,
  createRegistrationCheckoutByToken,
  getPendingRegistrationPayments,

  sendRegistrationPaymentLinkEmail,
};
