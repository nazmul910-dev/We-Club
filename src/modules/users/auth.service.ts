import QueryBuilder from "../../utility/queryBuilder";
import { IUser, UserRole } from "./user.interface";
import { User } from "./users.model.schema";
import { createAdminAccountValidation } from "./user.validation";
import { ExistingUserError } from "../../utility/errorResponses";
import { hashPassword } from "../../utility/passwordUtil";


const CREATABLE_ROLES_BY_ROLE: Record<string, UserRole[]> = {
  founder: ["manager", "super_admin", "co_mentor"],
  manager: ["super_admin", "co_mentor"],
};


const getAllUsersFromDB = async (
  query: Record<string, unknown>,
): Promise<{
  data: IUser[];
  meta: { page: number; limit: number; total: number; totalPage: number };
}> => {
  const { role, ...restQuery } = query as { role?: string; [key: string]: unknown };

  let baseFilter: Record<string, unknown> = {};

  if (role) {
    const roleList = String(role)
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);

    if (roleList.length > 1) {
      baseFilter.role = { $in: roleList };
    } else if (roleList.length === 1) {
      baseFilter.role = roleList[0];
    }
  }

  const userQuery = new QueryBuilder<IUser>(
    User.find(baseFilter).select("-password").lean(),
    restQuery,
  )
    .search(["fullName", "email"])
    .filter()
    .sort()
    .paginate();

  const data = await userQuery.modelQuery;
  const meta = await userQuery.countTotal();

  return {
    data,
    meta,
  };
};


const getSingleUserFromDB = async (id: any) => {
  const user = await User.findById(id).lean();
  return user;
};

const createAdminAccount = async (
  payload: unknown,
  requesterId: string,
  requesterRole: string
) => {
  const { body } = createAdminAccountValidation.parse({
    body: payload,
  });

  const allowedRoles = CREATABLE_ROLES_BY_ROLE[requesterRole];

  if (!allowedRoles || !allowedRoles.includes(body.role)) {
    throw new Error(
      `You are not permitted to create a '${body.role}' account.`
    );
  }

  const existingUser = await User.findOne({ email: body.email });

  if (existingUser) {
    throw new ExistingUserError("User already exists");
  }

  const hashedPassword = await hashPassword(body.password);

  const user = await User.create({
    fullName: body.fullName,
    email: body.email,
    password: hashedPassword,

    role: body.role,
    accessTo: body.accessTo,

    paymentStatus: "paid",
    subscriptionStatus: "active",

    approvalStatus: "approved",
    accountStatus: "active",
    licenseVerificationStatus: "verified",

    approvedBy: requesterId,
    approvedAt: new Date(),
  });

  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;

  return safeUser;
};

const activateManagerByAdmin = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!["manager", "super_admin", "co_mentor"].includes(user.role)) {
    throw new Error("Only admin accounts can be activated.");
  }

  if (user.accountStatus === "active") {
    throw new Error("Account is already active.");
  }

  user.accountStatus = "active";
  user.approvalStatus = "approved";
  user.paymentStatus = "paid";
  user.subscriptionStatus = "active";
  user.licenseVerificationStatus = "verified";

  await user.save();

  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;

  return safeUser;
};

const suspendManagerByAdmin = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!["manager", "super_admin", "co_mentor"].includes(user.role)) {
    throw new Error("Only admin accounts can be suspended.");
  }

  if (user.accountStatus === "suspended") {
    throw new Error("Account is already suspended.");
  }

  user.accountStatus = "suspended";

  await user.save();

  const userObject = user.toObject();
  const { password, ...safeUser } = userObject;

  return safeUser;
};

// 🔒 Delete: spec onujayi SHUDU Founder pare
const deleteManagerByAdmin = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role === "founder") {
    throw new Error("The Founder account cannot be deleted.");
  }

  await User.findByIdAndDelete(id);

  return null;
};

export const userService = {
  getAllUsersFromDB,
  getSingleUserFromDB,
  createAdminAccount,
  deleteManagerByAdmin,
  suspendManagerByAdmin,
  activateManagerByAdmin,
};