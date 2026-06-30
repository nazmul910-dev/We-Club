import config from '../../config';
import { UserRole } from '../users/user.interface';

export type BillingInterval = 'month' | 'year';

export type PricingItem = {
  name: string;
  description: string;
  amountCents: number;
  amount: number;
  currency: 'usd';
  interval: BillingInterval;
  formattedAmount: string;
  billingText: string;
};

export type RolePricingPlan = {
  role: UserRole;
  displayName: string;
  requiresPayment: boolean;
  items: PricingItem[];
  totalFirstPaymentCents: number;
  totalFirstPayment: number;
  totalFirstPaymentFormatted: string;
};

const throwConfigError = (message: string): never => {
  throw new Error(message);
};

const parseDollarAmountToCents = (
  value: string | undefined,
  envKey: string
): number => {
  if (!value) {
    throwConfigError(`${envKey} is missing in environment variables`);
  }

  const amount = Number(value);

  if (Number.isNaN(amount) || amount <= 0) {
    throwConfigError(`${envKey} must be a valid positive number`);
  }

  return Math.round(amount * 100);
};

const formatAmount = (amountCents: number): string => {
  return `$${(amountCents / 100).toFixed(2)}`;
};

const createPricingItem = ({
  name,
  description,
  amountCents,
  interval,
}: {
  name: string;
  description: string;
  amountCents: number;
  interval: BillingInterval;
}): PricingItem => {
  const formattedAmount = formatAmount(amountCents);

  return {
    name,
    description,
    amountCents,
    amount: amountCents / 100,
    currency: 'usd',
    interval,
    formattedAmount,
    billingText:
      interval === 'month'
        ? `${formattedAmount} / month`
        : `${formattedAmount} / year`,
  };
};

export const isPaidRole = (role: UserRole): boolean => {
  return [
    'associate',
    'partner',
    'ambassador',
    'ceo',
    'ceo_partner',
  ].includes(role);
};

export const getPricingByRole = (role: UserRole): RolePricingPlan => {
  let displayName = '';
  let items: PricingItem[] = [];

  switch (role) {
    case 'associate':
      displayName = 'World Elite Associate Membership';
      items = [
        createPricingItem({
          name: 'World Elite Associate Membership',
          description: 'Access to WÉ Command Center and INVICTUS Academy.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_ASSOCIATE_MONTHLY,
            'STRIPE_PRICE_ASSOCIATE_MONTHLY'
          ),
          interval: 'month',
        }),
      ];
      break;

    case 'partner':
      displayName = 'World Elite Partner Membership';
      items = [
        createPricingItem({
          name: 'World Elite Partner Membership',
          description: 'Access to WÉ Command Center and INVICTUS Academy.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_PARTNER_MONTHLY,
            'STRIPE_PRICE_PARTNER_MONTHLY'
          ),
          interval: 'month',
        }),
      ];
      break;

    case 'ambassador':
      displayName = 'World Elite Ambassador Membership';
      items = [
        createPricingItem({
          name: 'World Elite Ambassador Membership',
          description: 'Access to WÉ Command Center and INVICTUS Academy.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_AMBASSADOR_MONTHLY,
            'STRIPE_PRICE_AMBASSADOR_MONTHLY'
          ),
          interval: 'month',
        }),
      ];
      break;

    case 'ceo':
      displayName = 'CEO Club Membership';
      items = [
        createPricingItem({
          name: 'CEO Club Membership',
          description: 'Annual CEO Club access.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_CEO_YEARLY,
            'STRIPE_PRICE_CEO_YEARLY'
          ),
          interval: 'year',
        }),
      ];
      break;

    case 'ceo_partner':
      displayName = 'CEO Partner Membership';
      items = [
        createPricingItem({
          name: 'CEO Partner Yearly Membership',
          description: 'Annual CEO Partner access.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_CEO_PARTNER_YEARLY,
            'STRIPE_PRICE_CEO_PARTNER_YEARLY'
          ),
          interval: 'year',
        }),
        createPricingItem({
          name: 'CEO Partner Monthly Partner Subscription',
          description: 'Monthly partner subscription for CEO Partner.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_CEO_PARTNER_MONTHLY,
            'STRIPE_PRICE_CEO_PARTNER_MONTHLY'
          ),
          interval: 'month',
        }),
      ];
      break;

    default:
      displayName = role;
      items = [];
      break;
  }

  const totalFirstPaymentCents = items.reduce(
    (total, item) => total + item.amountCents,
    0
  );

  return {
    role,
    displayName,
    requiresPayment: items.length > 0,
    items,
    totalFirstPaymentCents,
    totalFirstPayment: totalFirstPaymentCents / 100,
    totalFirstPaymentFormatted: formatAmount(totalFirstPaymentCents),
  };
};

export const getAllPricingPlans = (): RolePricingPlan[] => {
  return [
    'associate',
    'partner',
    'ambassador',
    'ceo',
    'ceo_partner',
    'we_club_member',
  ].map((role) => getPricingByRole(role as UserRole));
};