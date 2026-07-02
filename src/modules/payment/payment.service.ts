import Stripe from 'stripe';
import config from '../../config';
import { sendCalendlyMeetingMail } from '../../utility/sendCalendlyMeeting';
import { User } from '../users/users.model.schema';
import { UserRole,AccessTo } from '../users/user.interface';
import { PaymentSession } from './payment.model.schema';
import { discountService } from '../discount/discount.service';
import {
  applyDiscountToPricingPlan,
  getAllPricingPlans,
  getPricingByRoleAndAccess,
  isPaidRole,
} from './payment.pricing';




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
    throwError('Stripe is not configured. Please set STRIPE_SECRET_KEY.', 500);
  }

  return stripeClient as Stripe;
};

type CheckoutPurpose = 'registration' | 'upgrade';

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

const getPricingPlanByRoleAndAccess = (
  role: UserRole,
  accessTo: AccessTo
) => {
  return getPricingByRoleAndAccess(role, accessTo);
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
    throwError('This role does not require Stripe payment', 400);
  }

  const originalPricingPlan = getPricingByRoleAndAccess(role, accessTo);

  if (
    !originalPricingPlan.requiresPayment ||
    originalPricingPlan.items.length === 0
  ) {
    throwError('No pricing configured for this role and access type', 500);
  }

  const discount = await discountService.validateDiscountCodeForCheckout({
    code: discountCode,
    role,
    accessTo,
    userId,
  });

  const finalPricingPlan = discount
    ? applyDiscountToPricingPlan(
        originalPricingPlan,
        discount.discountPercent
      )
    : originalPricingPlan;

  const sessionCreateParams: Record<string, unknown> = {
    mode: 'subscription',

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
      originalAmountCents: String(
        originalPricingPlan.totalFirstPaymentCents
      ),
      finalAmountCents: String(
        finalPricingPlan.totalFirstPaymentCents
      ),
      discountCode: discount?.code || '',
      discountPercent: String(discount?.discountPercent || 0),
    },

    subscription_data: {
      metadata: {
        userId,
        role,
        accessTo,
        purpose,
        discountCode: discount?.code || '',
        discountPercent: String(discount?.discountPercent || 0),
      },
    },
  };

  if (stripeCustomerId) {
    sessionCreateParams.customer = stripeCustomerId;
  } else {
    sessionCreateParams.customer_email = email;
  }

  // FIX 1: use getStripeClient() instead of the raw nullable `stripe` variable
  const stripeClient = getStripeClient();

  const session = await stripeClient.checkout.sessions.create(sessionCreateParams as any);

  if (!session.url) {
    throwError('Failed to create Stripe Checkout session', 500);
  }

  await PaymentSession.create(
    stripUndefined({
      user: userId,
      role,
      accessTo,
      purpose,
      status: 'pending',
      stripeCheckoutSessionId: session.id,
      stripeCustomerId:
        typeof session.customer === 'string' ? session.customer : undefined,
      checkoutUrl: session.url ?? undefined,
      amountTotal: finalPricingPlan.totalFirstPaymentCents,
      originalAmountTotal: originalPricingPlan.totalFirstPaymentCents,
      discountAmountTotal:
        originalPricingPlan.totalFirstPaymentCents -
        finalPricingPlan.totalFirstPaymentCents,
      discountCode: discount?.code,
      discountPercent: discount?.discountPercent,
      currency: 'usd',
    }) as any
  );

  await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        stripeCheckoutSessionId: session.id,
        subscriptionStatus: 'incomplete',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  return {
    checkoutUrl: session.url ?? null,
    sessionId: session.id,
    pricing: finalPricingPlan,
    originalPricing: originalPricingPlan,
    discount,
  };
};

const createUpgradeCheckoutSessionIntoStripe = async (
  userId: string,
  discountCode?: string
) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throwError('User not found', 404);
  }

  return createCheckoutSession({
    userId: String(user!._id),
    fullName: user!.fullName,
    email: user!.email,
    role: user!.role,
    accessTo: user!.accessTo,
    purpose: 'upgrade',
    discountCode,
    stripeCustomerId: user!.stripeCustomerId,
  });
};

const getSubscriptionPeriodEnd = (
  subscription: Stripe.Subscription
): Date | undefined => {
  const subscriptionWithPeriod = subscription as Stripe.Subscription & {
    current_period_end?: number;
  };

  if (!subscriptionWithPeriod.current_period_end) {
    return undefined;
  }

  return new Date(subscriptionWithPeriod.current_period_end * 1000);
};

const activateUserSubscription = async (
  session: Stripe.Checkout.Session
) => {
  const userId = session.metadata?.userId;
  const role = session.metadata?.role as UserRole | undefined;
  const accessTo = session.metadata?.accessTo as AccessTo | undefined;
  const purpose = session.metadata?.purpose as CheckoutPurpose | undefined;
  const discountCode = session.metadata?.discountCode || undefined;

  if (!userId || !role || !accessTo || !purpose) {
    throwError('Stripe session metadata is missing', 400);
  }

  const userIdVal = userId as string;
  const roleVal = role as UserRole;
  const accessToVal = accessTo as AccessTo;
  const purposeVal = purpose as CheckoutPurpose;

  const subscriptionId =
    typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

  const customerId =
    typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

  let subscriptionExpiresAt: Date | undefined;

  const stripeClient = getStripeClient();

  if (subscriptionId) {
    const subscription =
      await stripeClient.subscriptions.retrieve(subscriptionId);

    subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);
  }

  const userSetPayload: Record<string, unknown> = {
    paymentStatus: 'paid',
    subscriptionStatus: 'active',
    accessTo: accessToVal,
    stripeCheckoutSessionId: session.id,
    subscriptionStartAt: new Date(),
  };

  if (customerId) {
    userSetPayload.stripeCustomerId = customerId;
  }

  if (subscriptionId) {
    userSetPayload.stripeSubscriptionId = subscriptionId;
  }

  if (subscriptionExpiresAt) {
    userSetPayload.subscriptionExpiresAt = subscriptionExpiresAt;
  }

  if (purposeVal === 'registration') {
    userSetPayload.accountStatus = 'pending_approval';
  }

  const user = await User.findByIdAndUpdate(
    userIdVal,
    {
      $set: userSetPayload,
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    throwError('User not found while activating subscription', 404);
  }

  const currentUser = user as NonNullable<typeof user>;

  const paymentSetPayload: Record<string, unknown> = {
    status: 'paid',
    amountTotal:
      session.amount_total ||
      Number(session.metadata?.finalAmountCents) ||
      Number(session.metadata?.totalFirstPaymentCents) ||
      undefined,
    originalAmountTotal:
      Number(session.metadata?.originalAmountCents) || undefined,
    discountAmountTotal:
      Number(session.metadata?.originalAmountCents || 0) -
        Number(session.metadata?.finalAmountCents || 0) || undefined,
    discountCode: discountCode || undefined,
    discountPercent:
      Number(session.metadata?.discountPercent) || undefined,
    currency: session.currency || 'usd',
  };

  if (customerId) {
    paymentSetPayload.stripeCustomerId = customerId;
  }

  if (subscriptionId) {
    paymentSetPayload.stripeSubscriptionId = subscriptionId;
  }

  await PaymentSession.findOneAndUpdate(
    {
      stripeCheckoutSessionId: session.id,
    },
    {
      $set: paymentSetPayload,
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  if (discountCode) {
    await discountService.redeemDiscountCodeAfterPayment({
      code: discountCode,
      userId: userIdVal,
      role: roleVal,
      accessTo: accessToVal,
      stripeCheckoutSessionId: session.id,
    });
  }

  if (purposeVal === 'registration') {
    try {
      await sendCalendlyMeetingMail({
        fullName: currentUser.fullName,
        email: currentUser.email,
        role: currentUser.role,
      });
    } catch (error) {
      console.error(
        'Calendly meeting email failed:',
        error instanceof Error ? error.message : error
      );
    }
  }

  return user;
};

const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session
) => {
  const existingPayment = await PaymentSession.findOne({
    stripeCheckoutSessionId: session.id,
  });

  if (existingPayment?.status === 'paid') {
    return;
  }

  await activateUserSubscription(session);
};

const getInvoiceSubscriptionId = (
  invoice: Stripe.Invoice
): string | undefined => {
  const invoiceWithSubscription = invoice as Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  };

  if (typeof invoiceWithSubscription.subscription === 'string') {
    return invoiceWithSubscription.subscription;
  }

  return invoiceWithSubscription.subscription?.id;
};

const getInvoiceCustomerId = (
  invoice: Stripe.Invoice
): string | undefined => {
  if (typeof invoice.customer === 'string') {
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
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  const subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);

  const setPayload: Record<string, unknown> = {
    paymentStatus: 'paid',
    subscriptionStatus: 'active',
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
      returnDocument: 'after',
      runValidators: true,
    }
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
        paymentStatus: 'failed',
        subscriptionStatus: 'past_due',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
};

const handleSubscriptionDeletedOrExpired = async (
  subscription: Stripe.Subscription
) => {
  await User.findOneAndUpdate(
    {
      stripeSubscriptionId: subscription.id,
    },
    {
      $set: {
        paymentStatus: 'expired',
        subscriptionStatus: 'expired',
        subscriptionExpiresAt: new Date(),
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );
};

const handleStripeWebhook = async (
  rawBody: Buffer,
  signature: string | string[] | undefined
) => {
  const stripeSignatureValue = Array.isArray(signature) ? signature[0] : signature;

  if (typeof stripeSignatureValue !== 'string' || !stripeSignatureValue.trim()) {
    throwError('Stripe signature is missing', 400);
  }

  const stripeSignature = stripeSignatureValue as string;
  const webhookSecret = config.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throwError('Stripe webhook secret is missing', 500);
  }

  const stripeClient = getStripeClient();
  const stripeWebhookSecret = webhookSecret as string;
  let event: Stripe.Event | undefined;

  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      stripeSignature,
      stripeWebhookSecret
    );
  } catch {
    throwError('Invalid Stripe webhook signature', 400);
  }

  if (!event) {
    throwError('Unable to process Stripe webhook event', 500);
  }

  const webhookEvent = event as Stripe.Event;

  switch (webhookEvent.type) {
    case 'checkout.session.completed':
      await handleCheckoutSessionCompleted(
        webhookEvent.data.object as Stripe.Checkout.Session
      );
      break;

    case 'invoice.paid':
      await handleInvoicePaid(webhookEvent.data.object as Stripe.Invoice);
      break;

    case 'invoice.payment_failed':
      await handleInvoicePaymentFailed(webhookEvent.data.object as Stripe.Invoice);
      break;

    case 'customer.subscription.deleted':
      await handleSubscriptionDeletedOrExpired(
        webhookEvent.data.object as Stripe.Subscription
      );
      break;

    default:
      break;
  }
};

const verifyCheckoutSessionFromStripe = async (sessionId: string) => {
  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== 'paid') {
    return {
      paid: false,
      message: 'Payment is not completed yet',
    };
  }

  await activateUserSubscription(session);

  return {
    paid: true,
    message: 'Payment verified successfully',
  };
};

export const paymentService = {
  getAllPricingPlans,
  getPricingPlanByRoleAndAccess,
  createCheckoutSession,
  createUpgradeCheckoutSessionIntoStripe,
  handleStripeWebhook,
  verifyCheckoutSessionFromStripe,
};