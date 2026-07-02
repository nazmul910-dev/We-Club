import { sendAccountApprovedMail } from '../../utility/sendAccountApprovedMail';
import { User } from './users.model.schema';

export const sendApprovalEmailIfFullyApproved = async (userId: string) => {
  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      approvalStatus: 'approved',
      accountStatus: 'active',
      licenseVerificationStatus: 'verified',
      $or: [
        { approvalEmailSentAt: { $exists: false } },
        { approvalEmailSentAt: null },
      ],
    },
    {
      $set: {
        approvalEmailSentAt: new Date(),
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select(
    'fullName email role accessTo approvalStatus accountStatus licenseVerificationStatus approvalEmailSentAt'
  );

  if (!user) {
    return null;
  }

  try {
    await sendAccountApprovedMail({
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      accessTo: user.accessTo,
    });

    return user;
  } catch (error) {
    await User.findByIdAndUpdate(user._id, {
      $unset: {
        approvalEmailSentAt: '',
      },
    });

    console.error(
      'Account approval email failed:',
      error instanceof Error ? error.message : error
    );

    return null;
  }
};