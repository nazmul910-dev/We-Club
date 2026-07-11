import QueryBuilder from "../../utility/queryBuilder";
import { IUser } from "./user.interface";
import { User } from "./users.model.schema";


import { createManagerByAdminValidation } from "./user.validation";
import { ExistingUserError } from "../../utility/errorResponses";
import { hashPassword } from "../../utility/passwordUtil";

const getAllUsersFromDB  = async (query: any) => {

    const queryBuilder = new QueryBuilder<IUser>(User.find().select("-password"), query).search(["name", "email"]).filter().sort().paginate();
    
    const users = await queryBuilder.modelQuery;
    return users;
}

const getSingleUserFromDB = async(id:any) =>{
    const user = await User.findById(id)
    return user;
}


const createManagerByAdmin = async (
  payload: unknown,
  adminId: string
) => {
  const { body } = createManagerByAdminValidation.parse({
    body: payload,
  });

  const existingUser = await User.findOne({
    email: body.email,
  });

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

    approvedBy: adminId,
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

  if (user.role !== "manager") {
    throw new Error("Only managers can be activated.");
  }

  if (user.accountStatus === "active") {
    throw new Error("Manager is already active.");
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

  if (user.role !== "manager") {
    throw new Error("Only managers can be suspended.");
  }

  if (user.accountStatus === "suspended") {
    throw new Error("Manager is already suspended.");
  }

  user.accountStatus = "suspended";

  await user.save();

  return user;
};


const deleteManagerByAdmin = async (id: string) => {
  const user = await User.findById(id);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.role !== "manager") {
    throw new Error("Only managers can be deleted.");
  }

  await User.findByIdAndDelete(id);

  return null;
};

export const userService = { getAllUsersFromDB,getSingleUserFromDB,createManagerByAdmin,deleteManagerByAdmin,suspendManagerByAdmin ,activateManagerByAdmin};