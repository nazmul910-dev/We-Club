import Stripe from 'stripe';
import config from '../../config';
import { sendCalendlyMeetingMail } from '../../utility/sendCalendlyMeeting';
import { User } from '../users/users.model.schema';
import { UserRole } from '../users/user.interface';
import { PaymentSession } from './payment.model.schema';
import {
  getAllPricingPlans,
  getPricingByRole,
  isPaidRole,
} from './payment.pricing';

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const stripeSecretKey = config.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

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
  purpose: CheckoutPurpose;
  stripeCustomerId?: string | undefined;
};

const getPricingPlanByRole = (role: UserRole) => {
  return getPricingByRole(role);
};

const createCheckoutSession = async ({
  userId,
  fullName,
  email,
  role,
  purpose,
  stripeCustomerId,
}: CreateCheckoutPayload) => {
  if (!isPaidRole(role)) {
    throwError('This role does not require Stripe payment', 400);
  }

  const pricingPlan = getPricingByRole(role);

  if (!pricingPlan.requiresPayment || pricingPlan.items.length === 0) {
    throwError('No pricing configured for this role', 500);
  }

  const checkoutSessionPayload: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: pricingPlan.items.map((item) => ({
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
    allow_promotion_codes: true,
    success_url: `${config.FRONTEND_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.FRONTEND_URL}/payment/cancel`,
    metadata: {
      userId,
      role,
      purpose,
      fullName,
      email,
      totalFirstPaymentCents: String(pricingPlan.totalFirstPaymentCents),
    },
    subscription_data: {
      metadata: {
        userId,
        role,
        purpose,
      },
    },
  };

  if (stripeCustomerId) {
    checkoutSessionPayload.customer = stripeCustomerId;
  } else {
    checkoutSessionPayload.customer_email = email;
  }

  const stripeClient = getStripeClient();
  const session = await stripeClient.checkout.sessions.create(checkoutSessionPayload);

  if (!session.url) {
    throwError('Failed to create Stripe Checkout session', 500);
  }

  const paymentSessionPayload: Record<string, unknown> = {
    user: userId,
    role,
    purpose,
    status: 'pending',
    stripeCheckoutSessionId: session.id,
    checkoutUrl: session.url,
    amountTotal: pricingPlan.totalFirstPaymentCents,
    currency: 'usd',
  };

  if (typeof session.customer === 'string') {
    paymentSessionPayload.stripeCustomerId = session.customer;
  }

  await PaymentSession.create(paymentSessionPayload);

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
    checkoutUrl: session.url,
    sessionId: session.id,
    pricing: pricingPlan,
  };
};

const createUpgradeCheckoutSessionIntoStripe = async (userId: string) => {
  const user = await User.findById(userId).select('-password');

  if (!user) {
    throwError('User not found', 404);
  }

  const currentUser = user as NonNullable<typeof user>;

  return createCheckoutSession({
    userId: String(currentUser._id),
    fullName: currentUser.fullName,
    email: currentUser.email,
    role: currentUser.role,
    purpose: 'upgrade',
    stripeCustomerId: currentUser.stripeCustomerId || undefined,
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
  const purpose = session.metadata?.purpose as CheckoutPurpose | undefined;

  if (!userId || !role || !purpose) {
    throwError('Stripe session metadata is missing', 400);
  }

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
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    subscriptionExpiresAt = getSubscriptionPeriodEnd(subscription);
  }

  const userSetPayload: Record<string, unknown> = {
    paymentStatus: 'paid',
    subscriptionStatus: 'active',
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

  if (purpose === 'registration') {
    userSetPayload.accountStatus = 'pending_approval';
  }

  const user = await User.findByIdAndUpdate(
    userId,
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
    amountTotal: session.amount_total || Number(session.metadata?.totalFirstPaymentCents) || undefined,
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

  if (purpose === 'registration') {
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
  getPricingPlanByRole,
  createCheckoutSession,
  createUpgradeCheckoutSessionIntoStripe,
  handleStripeWebhook,
  verifyCheckoutSessionFromStripe,
};