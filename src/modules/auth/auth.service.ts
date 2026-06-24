import bcrypt from "bcrypt";
// import * as jwt from "jsonwebtoken";
import jwt from "jsonwebtoken";
import config from "../../config";

import { ExistingUserError } from "../../utility/errorResponses";
import { loginValidation, registerValidation } from "../users/user.validation";
import { User } from "../users/users.model.schema";
import { comparePassword, hashPassword } from "../../utility/passwordUtil";



export const createUser = async (payload: unknown) =>{
  const {body} = registerValidation.parse({body:payload});

  const existingUser = await User.findOne({email:body.email});
  
  if(existingUser) throw new ExistingUserError("User already exists");

  const hashedPassword = await hashPassword(body.password);

  // const validatedBody = removeUndefined(body);

  const user = await User.create({

    fullName: body.fullName,
    email: body.email,
    role: body.role,
    password: hashedPassword,
    paymentStatus: "unpaid",
    approvalStatus: "pending",
    accountStatus:"pending_approval",
    licenseVerificationStatus:"pending",
  });

  return user;

}


export const loginUser = async (payload: unknown) => {
  const { body } = loginValidation.parse({ body: payload });

  const user = await User.findOne({
    email: body.email,
  }).select('+password');

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isPasswordMatched = await comparePassword(body.password, user.password);

  if (!isPasswordMatched) {
    throw new Error('Invalid email or password.');
  }

  // if (user.paymentStatus !== 'paid') {
  //   throw new Error('Payment is not completed.');
  // }

  // if (user.approvalStatus !== 'approved') {
  //   throw new Error('Your account is waiting for admin approval.');
  // }

  // if (user.accountStatus !== 'active') {
  //   throw new Error('Your account is not active.');
  // }

  // if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
  //   throw new Error('Your subscription has expired.');
  // }

  const token = jwt.sign(
    {
      userId: user._id,
      role: user.role,
    },
    config.JWT_SECRET as string,
    {
      expiresIn: '7d',
    }
  );

  return {
    token,
    user,
  };
};



export default { createUser, loginUser };
