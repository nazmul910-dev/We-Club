import Stripe from "stripe";

import { Types } from "mongoose";

import config from "../../config";

import { ChallengePillar } from "../challengePillars/challenge.pillar.model.schema";
import { RetreatBatch } from "../retreatBatches/retreat.batch.model.schema";

import { PaymentPlan } from "../paymentPlans/payment.plan.model.schema";
import { PaymentPlanProductRefModel } from "../paymentPlans/payment.plan.interface";

import { PaymentSession } from "../payment/payment.model.schema";

import { userEntitlementService } from "../userEntitlements/userEntitlements.service";
import { notificationService } from "../notifications/notification.service";

import { ICreateInvictusCheckoutInput } from "./invictus.payment.interface";

const throwServiceError = (
  message: string,
  statusCode: number
): never => {
  const error = new Error(
    message
  ) as Error & {
    statusCode?: number;
  };

  error.statusCode = statusCode;

  throw error;
};

const assertFound: <T>(
  value: T | null | undefined,
  message: string,
  statusCode: number
) => asserts value is T = (
  value,
  message,
  statusCode
) => {
  if (
    value === null ||
    value === undefined
  ) {
    throwServiceError(
      message,
      statusCode
    );
  }
};

const stripUndefined = <
  T extends Record<string, unknown>
>(
  obj: T
): T => {
  const result = {} as T;

  for (const key in obj) {
    if (obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }

  return result;
};

const stripeSecretKey =
  config.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey)
  : null;

const getStripeClient = (): Stripe => {
  if (!stripe) {
    throwServiceError(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY.",
      500
    );
  }

  return stripe as Stripe;
};

const productLookup: Record<
  PaymentPlanProductRefModel,
  {
    findById: (
      id: string
    ) => Promise<{ _id: Types.ObjectId } | null>;
  }
> = {
  ChallengePillar: {
    findById: (id) =>
      ChallengePillar.findById(id),
  },

  RetreatBatch: {
    findById: (id) =>
      RetreatBatch.findById(id),
  },
};

const entitlementTypeForProductType: Record<
  string,
  "pillar" | "retreat" | "event" | "bundle"
> = {
  pillar: "pillar",
  retreat: "retreat",
  event: "event",
};

/**
 * INVICTUS Academy-এর কোনো paid product (pillar/retreat/event)
 * কেনার জন্য Stripe Checkout session তৈরি করে।
 *
 * Membership subscription checkout ইতিমধ্যে existing
 * payment.service.ts-এর createCheckoutSession দিয়ে হয়,
 * তাই এখানে সেটা duplicate করা হচ্ছে না।
 */
const createInvictusCheckoutSession = async ({
  userId,
  fullName,
  email,
  input,
}: {
  userId: string;
  fullName: string;
  email: string;
  input: ICreateInvictusCheckoutInput;
}) => {
  const stripeClient = getStripeClient();

  // 1. If pillarId is provided directly (or fallback when direct pillar is checked out)
  if (input.pillarId) {
    if (!Types.ObjectId.isValid(input.pillarId)) {
      throwServiceError("Pillar ID is invalid", 400);
    }

    const pillar = await ChallengePillar.findById(input.pillarId);
    assertFound(pillar, "Challenge pillar not found", 404);

    if (pillar.status === "archived") {
      throwServiceError("Cannot purchase an archived pillar", 400);
    }

    if (!pillar.isPaid) {
      throwServiceError("This pillar is free and does not require purchase", 400);
    }

    if (pillar.priceCents <= 0 && !pillar.stripePriceId) {
      throwServiceError("This pillar does not have a valid price configured", 400);
    }

    const lineItem = pillar.stripePriceId
      ? {
          price: pillar.stripePriceId,
          quantity: 1,
        }
      : {
          quantity: 1,
          price_data: {
            currency: (pillar.currency || "usd").toLowerCase(),
            unit_amount: pillar.priceCents,
            product_data: {
              name: pillar.title || pillar.name,
              description: pillar.tagline || pillar.description || "Invictus Challenge Pillar Access",
            },
          },
        };

    const sessionCreateParams: Record<string, unknown> = {
      mode: "payment",
      line_items: [lineItem],
      customer_email: email,
      success_url: `${config.FRONTEND_URL}/invictus/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.FRONTEND_URL}/invictus/payment/cancel`,
      metadata: {
        purpose: "invictus_purchase",
        userId,
        fullName,
        email,
        productType: "pillar",
        product: pillar._id.toString(),
        productRefModel: "ChallengePillar",
      },
    };

    const session = await stripeClient.checkout.sessions.create(
      sessionCreateParams as any
    );

    if (!session.url) {
      throwServiceError("Failed to create Stripe Checkout session", 500);
    }

    await PaymentSession.create(
      stripUndefined({
        user: userId,
        purpose: "invictus_purchase",
        status: "pending",
        stripeCheckoutSessionId: session.id,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : undefined,
        checkoutUrl: session.url ?? undefined,
        amountTotal: pillar.priceCents,
        currency: (pillar.currency || "usd").toLowerCase(),
        product: pillar._id,
        productRefModel: "ChallengePillar",
      }) as any
    );

    return {
      checkoutUrl: session.url as string,
      sessionId: session.id,
    };
  }

  // 2. If paymentPlanId is provided
  if (!input.paymentPlanId || !Types.ObjectId.isValid(input.paymentPlanId)) {
    throwServiceError("Payment plan ID is invalid", 400);
  }

  const plan = await PaymentPlan.findById(input.paymentPlanId);
  assertFound(plan, "Payment plan not found", 404);

  if (plan.status !== "active") {
    throwServiceError(
      "This payment plan is not currently available for purchase",
      400
    );
  }

  if (plan.productType === "membership") {
    throwServiceError(
      "Membership plans must be purchased through the membership checkout flow",
      400
    );
  }

  if (plan.mode !== "one_time") {
    throwServiceError(
      "Only one-time payment plans can be purchased through this endpoint",
      400
    );
  }

  if (plan.product && plan.productRefModel) {
    const lookup =
      productLookup[plan.productRefModel as PaymentPlanProductRefModel];

    if (lookup) {
      const referencedProduct = await lookup.findById(plan.product.toString());
      assertFound(
        referencedProduct,
        "The product linked to this payment plan no longer exists",
        404
      );
    }
  }

  const sessionCreateParams: Record<string, unknown> = {
    mode: "payment",
    line_items: [
      plan.stripePriceId
        ? {
            price: plan.stripePriceId,
            quantity: 1,
          }
        : {
            quantity: 1,
            price_data: {
              currency: plan.currency,
              unit_amount: plan.amountCents,
              product_data: {
                name: plan.name,
                description: plan.description,
              },
            },
          },
    ],
    customer_email: email,
    success_url: `${config.FRONTEND_URL}/invictus/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/invictus/payment/cancel`,
    metadata: {
      purpose: "invictus_purchase",
      userId,
      fullName,
      email,
      paymentPlanId: plan._id.toString(),
      productType: plan.productType,
      product: plan.product?.toString() ?? "",
      productRefModel: plan.productRefModel ?? "",
    },
  };

  const session = await stripeClient.checkout.sessions.create(
    sessionCreateParams as any
  );

  if (!session.url) {
    throwServiceError("Failed to create Stripe Checkout session", 500);
  }

  await PaymentSession.create(
    stripUndefined({
      user: userId,
      purpose: "invictus_purchase",
      status: "pending",
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === "string" ? session.customer : undefined,
      checkoutUrl: session.url ?? undefined,
      amountTotal: plan.amountCents,
      currency: plan.currency,
      paymentPlan: plan._id,
      product: plan.product,
      productRefModel: plan.productRefModel,
    }) as any
  );

  return {
    checkoutUrl: session.url as string,
    sessionId: session.id,
  };
};

/**
 * Stripe webhook (checkout.session.completed) থেকে কল হয়
 * যখন purpose === "invictus_purchase"।
 *
 * Idempotent: একই session একাধিকবার event পাঠালেও
 * PaymentSession-এর status ইতিমধ্যে "paid" থাকলে কিছুই করে না,
 * আর entitlement activation-ও grantEntitlementInternal-এর
 * duplicate-key handling-এর কারণে duplicate হয় না।
 */
const activateInvictusPurchase = async (
  session: Stripe.Checkout.Session
) => {
  const paymentSession =
    await PaymentSession.findOne({
      stripeCheckoutSessionId:
        session.id,
    });

  if (!paymentSession) {
    console.error(
      `INVICTUS webhook: no PaymentSession found for checkout ${session.id}`
    );

    return;
  }

  if (paymentSession.status === "paid") {
    /**
     * ইতিমধ্যে processed — idempotent no-op।
     */
    return;
  }

  paymentSession.status = "paid";

  if (
    typeof session.amount_total ===
    "number"
  ) {
    paymentSession.amountTotal =
      session.amount_total;
  }

  await paymentSession.save();

  const userId =
    paymentSession.user.toString();

  const productType =
    session.metadata?.productType;

  const productId =
    session.metadata?.product;

  if (
    !productType ||
    !productId ||
    productType === "other"
  ) {
    /**
     * generic/other product type-এর জন্য
     * কোনো auto entitlement grant হয় না।
     */
    return;
  }

  const entitlementType =
    entitlementTypeForProductType[
      productType
    ];

  if (!entitlementType) {
    console.warn(
      `INVICTUS webhook: unknown productType "${productType}" for session ${session.id}`
    );

    return;
  }

  await userEntitlementService.activateEntitlementFromPayment(
    {
      userId,

      entitlementType,

      ...(entitlementType === "pillar"
        ? { pillarId: productId }
        : { targetId: productId }),

      paymentSessionId:
        paymentSession._id.toString(),
    }
  );

  paymentSession.entitlementActivatedAt =
    new Date();

  await paymentSession.save();

  notificationService.safeCreateFromTemplateOrFallback({
    templateKey: "purchase_confirmed",
    fallbackTitle: "Purchase Confirmed",
    fallbackBody: `Your access to ${entitlementType === "pillar" ? "the Challenge Pillar" : entitlementType} has been successfully activated.`,
    recipient: userId,
    relatedEntityType: "PaymentSession",
    relatedEntityId: paymentSession._id.toString(),
    actionUrl: `/invictus/invictus-challenge`,
    dedupeKey: `purchase_confirmed:${paymentSession._id}`,
  }).catch(() => {});
};

const getMyInvictusPurchases = async (
  userId: string
) => {
  return PaymentSession.find({
    user: new Types.ObjectId(userId),
    purpose: "invictus_purchase",
  })
    .sort({ createdAt: -1 })
    .populate(
      "paymentPlan",
      "name slug productType mode amountCents currency"
    ).lean();
};

export const invictusPaymentService = {
  createInvictusCheckoutSession,
  activateInvictusPurchase,
  getMyInvictusPurchases,
};
