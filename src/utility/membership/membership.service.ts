import { User } from "../../modules/users/users.model.schema";


export const syncMembershipExpiry = async (
  userId: string
) => {
  const user = await User.findById(userId);

  if (!user) {
    return null;
  }

  if (
    user.membershipAccessStatus === 'active' &&
    user.subscriptionExpiresAt &&
    user.subscriptionExpiresAt <= new Date()
  ) {
    user.membershipAccessStatus = 'expired';

    user.subscriptionStatus = 'expired';

    user.paymentStatus = 'expired';

    await user.save();
  }

  return user;
};