import {
  QueryFilter,
  Types,
} from "mongoose";

import { ChallengePillar } from "../challengePillars/challenge.pillar.model.schema";
import { RetreatBatch } from "../retreatBatches/retreat.batch.model.schema";

import {
  ICreatePaymentPlan,
  IPaymentPlan,
  IUpdatePaymentPlan,
  PaymentPlanProductRefModel,
} from "./payment.plan.interface";

import { PaymentPlan } from "./payment.plan.model.schema";

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

const assertValidObjectId = (
  value: string,
  fieldName: string
): void => {
  if (!Types.ObjectId.isValid(value)) {
    throwServiceError(
      `${fieldName} is invalid`,
      400
    );
  }
};

const isDuplicateKeyError = (
  error: unknown
): boolean => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: number })
      .code === 11000
  );
};

const productModelMap: Record<
  PaymentPlanProductRefModel,
  {
    findById: (
      id: string
    ) => Promise<unknown>;
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

const ensureProductReferenceIsValid =
  async ({
    productType,
    product,
    productRefModel,
  }: {
    productType: string;
    product?: string | undefined;
    productRefModel?:
      | PaymentPlanProductRefModel
      | undefined;
  }) => {
    if (
      productType === "membership" ||
      productType === "other"
    ) {
      return;
    }

    if (!product || !productRefModel) {
      throwServiceError(
        "product and productRefModel are required for this productType",
        400
      );
    }

    assertValidObjectId(
      product as string,
      "Product ID"
    );

    const expectedRefModel =
      productType === "pillar"
        ? "ChallengePillar"
        : productType === "retreat"
        ? "RetreatBatch"
        : undefined;

    if (
      expectedRefModel &&
      productRefModel !==
        expectedRefModel
    ) {
      throwServiceError(
        `productRefModel must be ${expectedRefModel} for productType "${productType}"`,
        400
      );
    }

    const lookup =
      productModelMap[
        productRefModel as PaymentPlanProductRefModel
      ];

    if (!lookup) {
      throwServiceError(
        "Unsupported productRefModel",
        400
      );
    }

    const referencedProduct =
      await lookup.findById(
        product as string
      );

    assertFound(
      referencedProduct,
      "Referenced product not found",
      404
    );
  };

const createPaymentPlan = async (
  payload: ICreatePaymentPlan,
  actorId: string
) => {
  await ensureProductReferenceIsValid(
    {
      productType:
        payload.productType,
      product: payload.product,
      productRefModel:
        payload.productRefModel,
    }
  );

  if (
    payload.mode ===
      "subscription" &&
    !payload.interval
  ) {
    throwServiceError(
      "interval is required when mode is subscription",
      400
    );
  }

  const createData: Record<
    string,
    unknown
  > = {
    name: payload.name,
    slug: payload.slug
      .trim()
      .toLowerCase(),

    productType: payload.productType,

    mode: payload.mode,

    amountCents: payload.amountCents,
    currency:
      payload.currency ?? "usd",

    order: payload.order ?? 1,

    status: "draft",
    isActive: true,

    createdBy:
      new Types.ObjectId(actorId),
  };

  if (
    payload.description !== undefined
  ) {
    createData.description =
      payload.description;
  }

  if (payload.product !== undefined) {
    createData.product =
      new Types.ObjectId(
        payload.product
      );

    createData.productRefModel =
      payload.productRefModel;
  }

  if (payload.interval !== undefined) {
    createData.interval =
      payload.interval;

    createData.intervalCount =
      payload.intervalCount ?? 1;
  }

  if (
    payload.stripeProductId !==
    undefined
  ) {
    createData.stripeProductId =
      payload.stripeProductId;
  }

  if (
    payload.stripePriceId !== undefined
  ) {
    createData.stripePriceId =
      payload.stripePriceId;
  }

  try {
    const plan =
      await PaymentPlan.create(
        createData
      );

    return plan.populate(
      "createdBy",
      "fullName email role profileImage"
    );
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A payment plan with this slug or product/mode combination already exists",
        409
      );
    }

    throw error;
  }
};

const getAllPaymentPlans = async ({
  productType,
  mode,
  status,
  includeArchived = false,
}: {
  productType?: string | undefined;
  mode?: string | undefined;
  status?: string | undefined;
  includeArchived?:
    | boolean
    | undefined;
}) => {
  const filter: QueryFilter<
    IPaymentPlan
  > = {};

  if (productType) {
    filter.productType =
      productType as IPaymentPlan["productType"];
  }

  if (mode) {
    filter.mode =
      mode as IPaymentPlan["mode"];
  }

  if (status) {
    filter.status =
      status as IPaymentPlan["status"];
  } else if (!includeArchived) {
    filter.status = {
      $ne: "archived",
    };
  }

  return PaymentPlan.find(filter)
    .sort({
      productType: 1,
      order: 1,
    })
    .populate(
      "createdBy",
      "fullName email role profileImage"
    )
    .populate(
      "updatedBy",
      "fullName email role profileImage"
    );
};

const getSinglePaymentPlan = async (
  planId: string
) => {
  assertValidObjectId(
    planId,
    "Payment plan ID"
  );

  const plan =
    await PaymentPlan.findById(
      planId
    )
      .populate(
        "createdBy",
        "fullName email role profileImage"
      )
      .populate(
        "updatedBy",
        "fullName email role profileImage"
      );

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  return plan;
};

const getPaymentPlanBySlug = async (
  slug: string
) => {
  const plan =
    await PaymentPlan.findOne({
      slug: slug.trim().toLowerCase(),
      status: { $ne: "archived" },
    });

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  return plan;
};

const updatePaymentPlan = async (
  planId: string,
  payload: IUpdatePaymentPlan,
  actorId: string
) => {
  assertValidObjectId(
    planId,
    "Payment plan ID"
  );

  const plan =
    await PaymentPlan.findById(
      planId
    );

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  if (plan.status === "archived") {
    throwServiceError(
      "Archived payment plan cannot be updated",
      400
    );
  }

  const nextProductType =
    payload.productType ??
    plan.productType;

  const nextProduct =
    payload.product === null
      ? undefined
      : payload.product ??
        plan.product?.toString();

  const nextProductRefModel =
    payload.productRefModel === null
      ? undefined
      : payload.productRefModel ??
        plan.productRefModel;

  if (
    payload.productType !==
      undefined ||
    payload.product !== undefined ||
    payload.productRefModel !==
      undefined
  ) {
    await ensureProductReferenceIsValid(
      {
        productType: nextProductType,
        product: nextProduct,
        productRefModel:
          nextProductRefModel,
      }
    );
  }

  if (payload.name !== undefined) {
    plan.name = payload.name;
  }

  if (payload.slug !== undefined) {
    plan.slug = payload.slug
      .trim()
      .toLowerCase();
  }

  if (payload.description === null) {
    plan.set(
      "description",
      undefined
    );
  } else if (
    payload.description !== undefined
  ) {
    plan.description =
      payload.description;
  }

  if (
    payload.productType !== undefined
  ) {
    plan.productType =
      payload.productType;
  }

  if (payload.product === null) {
    plan.set("product", undefined);
    plan.set(
      "productRefModel",
      undefined
    );
  } else if (
    payload.product !== undefined
  ) {
    plan.product =
      new Types.ObjectId(
        payload.product
      );
  }

  if (
    payload.productRefModel ===
    null
  ) {
    plan.set(
      "productRefModel",
      undefined
    );
  } else if (
    payload.productRefModel !==
    undefined
  ) {
    plan.productRefModel =
      payload.productRefModel;
  }

  if (payload.mode !== undefined) {
    plan.mode = payload.mode;
  }

  if (
    plan.mode === "subscription" &&
    !plan.interval &&
    payload.interval === undefined
  ) {
    throwServiceError(
      "interval is required when mode is subscription",
      400
    );
  }

  if (
    payload.amountCents !== undefined
  ) {
    plan.amountCents =
      payload.amountCents;
  }

  if (payload.currency !== undefined) {
    plan.currency = payload.currency;
  }

  if (payload.interval === null) {
    plan.set("interval", undefined);
  } else if (
    payload.interval !== undefined
  ) {
    plan.interval = payload.interval;
  }

  if (
    payload.intervalCount === null
  ) {
    plan.set(
      "intervalCount",
      undefined
    );
  } else if (
    payload.intervalCount !==
    undefined
  ) {
    plan.intervalCount =
      payload.intervalCount;
  }

  if (
    payload.stripeProductId === null
  ) {
    plan.set(
      "stripeProductId",
      undefined
    );
  } else if (
    payload.stripeProductId !==
    undefined
  ) {
    plan.stripeProductId =
      payload.stripeProductId;
  }

  if (payload.stripePriceId === null) {
    plan.set(
      "stripePriceId",
      undefined
    );
  } else if (
    payload.stripePriceId !==
    undefined
  ) {
    plan.stripePriceId =
      payload.stripePriceId;
  }

  if (payload.order !== undefined) {
    plan.order = payload.order;
  }

  plan.updatedBy =
    new Types.ObjectId(actorId);

  try {
    await plan.save();
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      throwServiceError(
        "A payment plan with this slug or product/mode combination already exists",
        409
      );
    }

    throw error;
  }

  return plan.populate(
    "updatedBy",
    "fullName email role profileImage"
  );
};

const activatePaymentPlan = async (
  planId: string,
  actorId: string
) => {
  assertValidObjectId(
    planId,
    "Payment plan ID"
  );

  const plan =
    await PaymentPlan.findById(
      planId
    );

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  if (plan.status === "archived") {
    throwServiceError(
      "Archived payment plan cannot be activated",
      400
    );
  }

  plan.status = "active";
  plan.isActive = true;
  plan.publishedAt = new Date();

  plan.set("archivedAt", undefined);

  plan.updatedBy =
    new Types.ObjectId(actorId);

  await plan.save();

  return plan;
};

const deactivatePaymentPlan = async (
  planId: string,
  actorId: string
) => {
  assertValidObjectId(
    planId,
    "Payment plan ID"
  );

  const plan =
    await PaymentPlan.findById(
      planId
    );

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  if (plan.status === "archived") {
    throwServiceError(
      "Archived payment plan cannot be moved to draft",
      400
    );
  }

  plan.status = "draft";
  plan.isActive = false;

  plan.set("publishedAt", undefined);

  plan.updatedBy =
    new Types.ObjectId(actorId);

  await plan.save();

  return plan;
};

const archivePaymentPlan = async (
  planId: string,
  actorId: string
) => {
  assertValidObjectId(
    planId,
    "Payment plan ID"
  );

  const plan =
    await PaymentPlan.findById(
      planId
    );

  assertFound(
    plan,
    "Payment plan not found",
    404
  );

  plan.status = "archived";
  plan.isActive = false;
  plan.archivedAt = new Date();

  plan.set("publishedAt", undefined);

  plan.updatedBy =
    new Types.ObjectId(actorId);

  await plan.save();

  return plan;
};

export const paymentPlanService = {
  createPaymentPlan,

  getAllPaymentPlans,
  getSinglePaymentPlan,
  getPaymentPlanBySlug,

  updatePaymentPlan,

  activatePaymentPlan,
  deactivatePaymentPlan,
  archivePaymentPlan,
};
