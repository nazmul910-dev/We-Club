import config from '../../config';
import {
  AccessTo,
  UserRole,
} from '../users/user.interface';

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
  accessTo: AccessTo;
  displayName: string;
  requiresPayment: boolean;
  items: PricingItem[];
  totalFirstPaymentCents: number;
  totalFirstPayment: number;
  totalFirstPaymentFormatted: string;
};

const parseDollarAmountToCents = (
  value: string | undefined,
  envKey: string
): number => {
  if (!value) {
    throw new Error(`${envKey} is missing in environment variables`);
  }

  const amount = Number(value);

  if (Number.isNaN(amount) || amount <= 0) {
    throw new Error(`${envKey} must be a valid positive number`);
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

const getMemberAccessPrice = (accessTo: AccessTo): number => {
  if (accessTo === 'we_command_center') {
    return parseDollarAmountToCents(
      config.STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY,
      'STRIPE_PRICE_WE_COMMAND_CENTER_MONTHLY'
    );
  }

  if (accessTo === 'invictus') {
    return parseDollarAmountToCents(
      config.STRIPE_PRICE_INVICTUS_MONTHLY,
      'STRIPE_PRICE_INVICTUS_MONTHLY'
    );
  }

  return parseDollarAmountToCents(
    config.STRIPE_PRICE_BOTH_MONTHLY,
    'STRIPE_PRICE_BOTH_MONTHLY'
  );
};

const getAccessDisplayName = (accessTo: AccessTo): string => {
  if (accessTo === 'we_command_center') {
    return 'WÉ Command Center';
  }

  if (accessTo === 'invictus') {
    return 'INVICTUS Academy';
  }

  return 'WÉ Command Center + INVICTUS Academy';
};

export const getPricingByRoleAndAccess = (
  role: UserRole,
  accessTo: AccessTo
): RolePricingPlan => {
  let displayName = '';
  let items: PricingItem[] = [];

  const accessName = getAccessDisplayName(accessTo);

  if (['associate', 'partner', 'ambassador'].includes(role)) {
    displayName = `${role.toUpperCase()} - ${accessName}`;

    items = [
      createPricingItem({
        name: displayName,
        description: `Access to ${accessName}.`,
        amountCents: getMemberAccessPrice(accessTo),
        interval: 'month',
      }),
    ];
  }

  if (role === 'ceo') {
    displayName = 'CEO Club Membership';

    if (accessTo === 'we_command_center') {
      items = [
        createPricingItem({
          name: 'WÉ Command Center Access',
          description: 'Access to WÉ Command Center.',
          amountCents: getMemberAccessPrice('we_command_center'),
          interval: 'month',
        }),
      ];
    } else {
      items = [
        createPricingItem({
          name: 'CEO Club Membership',
          description:
            'INVICTUS Academy Accountability, courses, online events and content creation.',
          amountCents: parseDollarAmountToCents(
            config.STRIPE_PRICE_CEO_YEARLY,
            'STRIPE_PRICE_CEO_YEARLY'
          ),
          interval: 'year',
        }),
      ];

      if (accessTo === 'both') {
        items.push(
          createPricingItem({
            name: 'WÉ Command Center Access',
            description: 'Access to WÉ Command Center.',
            amountCents: getMemberAccessPrice('we_command_center'),
            interval: 'month',
          })
        );
      }
    }
  }

  if (role === 'ceo_partner') {
    displayName = 'CEO Partner Membership';

    if (accessTo === 'we_command_center') {
      items = [
        createPricingItem({
          name: 'WÉ Command Center Access',
          description: 'Access to WÉ Command Center.',
          amountCents: getMemberAccessPrice('we_command_center'),
          interval: 'month',
        }),
      ];
    } else {
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
      ];

      if (accessTo === 'both') {
        items.push(
          createPricingItem({
            name: 'WÉ Command Center Access',
            description: 'Access to WÉ Command Center.',
            amountCents: getMemberAccessPrice('we_command_center'),
            interval: 'month',
          })
        );
      }
    }
  }

  const totalFirstPaymentCents = items.reduce(
    (total, item) => total + item.amountCents,
    0
  );

  return {
    role,
    accessTo,
    displayName,
    requiresPayment: items.length > 0,
    items,
    totalFirstPaymentCents,
    totalFirstPayment: totalFirstPaymentCents / 100,
    totalFirstPaymentFormatted: formatAmount(totalFirstPaymentCents),
  };
};

export const applyDiscountToPricingPlan = (
  pricingPlan: RolePricingPlan,
  discountPercent: number
): RolePricingPlan => {
  if (discountPercent <= 0) {
    return pricingPlan;
  }

  const discountedItems = pricingPlan.items.map((item) => {
    const discountedAmountCents = Math.max(
      50,
      Math.round(item.amountCents * ((100 - discountPercent) / 100))
    );

    return {
      ...item,
      amountCents: discountedAmountCents,
      amount: discountedAmountCents / 100,
      formattedAmount: formatAmount(discountedAmountCents),
      billingText:
        item.interval === 'month'
          ? `${formatAmount(discountedAmountCents)} / month`
          : `${formatAmount(discountedAmountCents)} / year`,
    };
  });

  const totalFirstPaymentCents = discountedItems.reduce(
    (total, item) => total + item.amountCents,
    0
  );

  return {
    ...pricingPlan,
    items: discountedItems,
    totalFirstPaymentCents,
    totalFirstPayment: totalFirstPaymentCents / 100,
    totalFirstPaymentFormatted: formatAmount(totalFirstPaymentCents),
  };
};

export const getAllPricingPlans = (): RolePricingPlan[] => {
  const roles: UserRole[] = [
    'associate',
    'partner',
    'ambassador',
    'ceo',
    'ceo_partner',
  ];

  const accessList: AccessTo[] = [
    'we_command_center',
    'invictus',
    'both',
  ];

  return roles.flatMap((role) =>
    accessList.map((accessTo) =>
      getPricingByRoleAndAccess(role, accessTo)
    )
  );
};