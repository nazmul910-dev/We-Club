import { IUser, AccessTo, MembershipAccessStatus } from "../modules/users/user.interface";

declare global {
  namespace Express {
    interface Request {
      user?: Pick<IUser, "email" | "role"> & {
        id: string;
        accessTo?: AccessTo | undefined;
        membershipAccessStatus?: MembershipAccessStatus | undefined;
      };
    }
  }
}
