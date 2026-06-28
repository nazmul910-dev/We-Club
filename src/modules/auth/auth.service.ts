import bcrypt from "bcrypt";
// import * as jwt from "jsonwebtoken";
import jwt, { JwtPayload } from "jsonwebtoken";
import config from "../../config";

import { ExistingUserError } from "../../utility/errorResponses";
import { loginValidation, registerValidation } from "../users/user.validation";
import { User } from "../users/users.model.schema";
import { comparePassword, hashPassword } from "../../utility/passwordUtil";
import { IUser, UserRole } from "../users/user.interface";
import { createToken, verifyToken } from "./auth.utils";
import sendMail from "../../utility/SendMail";
import { sendCalendlyMeetingMail } from "../../utility/sendCalendlyMeeting";



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

  try {
     await sendCalendlyMeetingMail({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error(
      'Calendly meeting email failed:',
      error instanceof Error ? error.message : error
    );
  }

  const userObject = user.toObject();

  // delete userObject.password;

  return userObject;

} 


// export const loginUser = async (payload: unknown) => {
//   const { body } = loginValidation.parse({ body: payload });

//   const user = await User.findOne({
//     email: body.email,
//   }).select('+password');

//   if (!user) {
//     throw new Error('Invalid email or password.');
//   }

//   const isPasswordMatched = await comparePassword(body.password, user.password);

//   if (!isPasswordMatched) {
//     throw new Error('Invalid email or password.');
//   }

//   // if (user.paymentStatus !== 'paid') {
//   //   throw new Error('Payment is not completed.');
//   // }

//   if (user.approvalStatus !== 'approved') {
//     throw new Error('Your account is waiting for admin approval.');
//   }

//   if (user.accountStatus !== 'active') {
//     throw new Error('Your account is not active.');
//   }

//   // if (user.subscriptionExpiresAt && user.subscriptionExpiresAt < new Date()) {
//   //   throw new Error('Your subscription has expired.');
//   // }



//   // const token = jwt.sign(
//   //   {
//   //     id: user._id.toString(),
//   //     email: user.email,
//   //     role: user.role,
//   //   },
//   //   config.JWT_ACCESS_SECRET as string,
//   //   {
//   //     expiresIn: '7d',
//   //   }
//   // );

//   const jwtPayload = {
//     id: user._id.toString(),
//     email: user.email,
//     role: user.role,
//   };

//     // Access token
//   const accessToken = jwt.sign(
//     jwtPayload,
//     config.JWT_ACCESS_SECRET as string,
//     { expiresIn: '7d' }
//   );

//   // Refresh token
//   const refreshToken = createToken(
//     { userId: user._id.toString(), role: user.role },
//     config.JWT_REFRESH_SECRET as string,
//     7 * 24 * 60 * 60  
//   );

//   return {
//     accessToken, refreshToken, user
//   };
// };

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


  if (user.approvalStatus === 'pending') {
    throw new Error(
      'Your account is pending admin approval. Please try again later.'
    );
  } 

  if (user.approvalStatus === 'rejected') {
    throw new Error(
      'Your registration request has been rejected. This email cannot be used to access the platform. Please contact support for further assistance.'
    );
  }

  if (user.approvalStatus !== 'approved') {
    throw new Error('Your account is not approved yet. Please try again later.');
  }



  if (user.accountStatus === 'pending_approval') {
    throw new Error(
      'Your account is pending admin approval. Please try again later.'
    );
  }

  if (user.accountStatus === 'pending_payment') {
    throw new Error(
      'Your account payment is not completed yet. Please complete your payment to continue.'
    );
  }

  if (user.accountStatus === 'suspended') {
    throw new Error(
      'Your account has been suspended. Please contact support for further assistance.'
    );
  }

  if (user.accountStatus === 'rejected') {
    throw new Error(
      'Your account request has been rejected. This email cannot be used to access the platform. Please contact support for further assistance.'
    );
  }

  if (user.accountStatus !== 'active') {
    throw new Error('Your account is not active. Please contact support.');
  }

  const jwtPayload = {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
  };

  const accessToken = jwt.sign(
    jwtPayload,
    config.JWT_ACCESS_SECRET as string,
    {
      expiresIn: '7d',
    }
  );

  const refreshToken = createToken(
    {
      userId: user._id.toString(),
      role: user.role,
    },
    config.JWT_REFRESH_SECRET as string,
    7 * 24 * 60 * 60
  );

  const userObject = user.toObject();

  // delete userObject.password;

  return {
    accessToken,
    refreshToken,
    user: userObject,
  };
};
export const changePassword = async(userData: { email: string; role: UserRole },payload:{oldPassword:string,newPassword:string}) =>{

 const user = await User.findOne({ email: userData.email }).select("+password");

 console.log("users1:",user);

  if (!user) {
    throw new ExistingUserError("User not exists");
  }

  const isPasswordMatched = await comparePassword(payload.oldPassword, user.password);

  if(!isPasswordMatched){
    throw new ExistingUserError("Old password is incorrect");
  }

  const hashedNewPassword = await hashPassword(payload.newPassword);

  await User.findOneAndUpdate(
    {email: userData.email},
    {password: hashedNewPassword}
  );

  return {
    message: "Password changed successfully"
  };

}


export const forgetPassword = async(email:string) =>{
  const user = await User.findOne({email});

  if(!user) throw new ExistingUserError("User not found");

  // if need to some condition then ther check
  // 

  const jwtPayload = {
    userId: user._id.toString(),
    role: user.role
  };

  const token = createToken(
    jwtPayload, config.JWT_ACCESS_SECRET as string, 10 * 60 * 1000
  )

  const resetUILink = `http://localhost:5000/reset-password?token=${token}`;

//   await sendMail(
//   user.email,
//   `
//   <div style="font-family: Arial, sans-serif; background-color: #f4f7fb; padding: 30px;">
//     <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; border: 1px solid #e5e7eb;">
      
//       <h2 style="color: #111827; margin-bottom: 16px;">
//         Reset Your Password
//       </h2>

//       <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
//         We received a request to reset the password for your account.
//         Click the button below to create a new password.
//       </p>

//       <div style="text-align: center; margin: 30px 0;">
//         <a 
//           href="${resetUILink}" 
//           target="_blank"
//           style="
//             display: inline-block;
//             background-color: #2563eb;
//             color: #ffffff;
//             text-decoration: none;
//             padding: 14px 28px;
//             border-radius: 8px;
//             font-size: 15px;
//             font-weight: 600;
//           "
//         >
//           Reset Password
//         </a>
//       </div>

//       <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
//         This password reset link will expire within 10 minutes.
//         If you did not request this, you can safely ignore this email.
//       </p>

//       <p style="color: #9ca3af; font-size: 13px; margin-top: 24px;">
//         Thank you,<br />
//         We-Club Team
//       </p>

//     </div>
//   </div>
//   `
// );

  sendMail(user?.email, `<p> ${resetUILink}</p>`)   


}

export const resetPassword = async(payload:{newPassword:any},token:string) =>{
 
  // if need to some condition then ther check
  // 

  const decoded = verifyToken(
    token,config.JWT_ACCESS_SECRET as string
  ) as JwtPayload

  const user = await User.findById(decoded.userId)

    if (!user) {
    throw new ExistingUserError("User not found");
  }

  console.log("userId:",decoded.userId);

  console.log("new:pasowrd:",payload.newPassword);
  const newHashPassword = await hashPassword(payload.newPassword);


  await User.findByIdAndUpdate(decoded.userId,{password:newHashPassword});

  return{
    message:"Password reset successfully"
  }
  
}

export const refreshtoken = async(token:string) =>{
  if(!token){
    throw new Error("Token not found.Unauthorized user!");
  }

  const decoded = verifyToken(token,config.JWT_REFRESH_SECRET as string) as JwtPayload;

  if(!decoded){
    throw new Error("Could not verify token.");
  }

  const {userId} = decoded as JwtPayload

  const user = await User.findById(userId);

  if(!user){
    throw new Error("User not Found!");
  }

    const jwtPayload = {
    userId : user._id.toString(),
    email: user.email,
    role: user.role
  }

  // const accessToken = createToken (
  //   jwtPayload,config.JWT_ACCESS_SECRET as string, Number(config.JWT_ACCESS_SECRET)
  // )
    const accessToken = jwt.sign(
    jwtPayload,
    config.JWT_ACCESS_SECRET as string,
    { expiresIn: '7d' }
  );

  return{
    accessToken
  }
}

export default { createUser, loginUser,changePassword,forgetPassword,resetPassword,refreshtoken };
