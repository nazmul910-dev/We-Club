import { Types } from 'mongoose';
import { User } from '../users/users.model.schema';
import {
  AccountStatus,
  ApprovalStatus,
  LicenseVerificationStatus,
} from '../users/user.interface';
import { sendApprovalEmailIfFullyApproved } from '../users/user.approvalMail';

type UpdateApprovalStatusPayload = {
  approvalStatus: ApprovalStatus;
  rejectedReason?: string | undefined;
};

type UpdateLicenseVerificationStatusPayload = {
  licenseVerificationStatus: LicenseVerificationStatus;
};

type UpdateAccountStatusPayload = {
  accountStatus: AccountStatus;
};

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const updateUserApprovalStatusIntoDB = async (
  userId: string,
  payload: UpdateApprovalStatusPayload,
  adminId: string
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throwError('Invalid user id', 400);
  }

  if (!Types.ObjectId.isValid(adminId)) {
    throwError('Invalid admin id', 400);
  }

  const updateQuery: {
    $set: Record<string, unknown>;
    $unset?: Record<string, unknown>;
  } = {
    $set: {
      approvalStatus: payload.approvalStatus,
    },
  };

  if (payload.approvalStatus === 'approved') {

    const existingUser = await User.findById(userId).select(
      'licenseVerificationStatus accountStatus'
    );

    if (!existingUser) {
      throwError('User not found', 404);
    }

    const alreadyVerified =
      existingUser?.licenseVerificationStatus === 'verified';
    const alreadyActive = existingUser?.accountStatus === 'active';

    if (!(alreadyVerified && alreadyActive)) {
      updateQuery.$set.licenseVerificationStatus = 'verified';
      updateQuery.$set.accountStatus = 'active';
    }

    updateQuery.$set.approvedBy = new Types.ObjectId(adminId);
    updateQuery.$set.approvedAt = new Date();

    updateQuery.$unset = {
      rejectedReason: '',
    };
  }

  if (payload.approvalStatus === 'rejected') {
    const rejectedReason = payload.rejectedReason?.trim();

    if (!rejectedReason) {
      throwError('Rejected reason is required', 400);
    }

    updateQuery.$set.licenseVerificationStatus = 'rejected';
    updateQuery.$set.accountStatus = 'rejected';
    updateQuery.$set.rejectedReason = rejectedReason;

    updateQuery.$unset = {
      approvedBy: '',
      approvedAt: '',
    };
  }

  if (payload.approvalStatus === 'pending') {
    updateQuery.$set.licenseVerificationStatus = 'pending';
    updateQuery.$set.accountStatus = 'pending_approval';

    updateQuery.$unset = {
      approvedBy: '',
      approvedAt: '',
      rejectedReason: '',
    };
  }

  const updatedUser = await User.findByIdAndUpdate(userId, updateQuery, {
    new: true,
    runValidators: true,
  }).select('-password');

  if (!updatedUser) {
    throwError('User not found', 404);
  }

  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));

  return updatedUser;
};

const updateUserLicenseVerificationStatusIntoDB = async (
  userId: string,
  payload: UpdateLicenseVerificationStatusPayload
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throwError('Invalid user id', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        licenseVerificationStatus: payload.licenseVerificationStatus,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!updatedUser) {
    throwError('User not found', 404);
  }

  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));

  return updatedUser;
};

const updateUserAccountStatusIntoDB = async (
  userId: string,
  payload: UpdateAccountStatusPayload
) => {
  if (!Types.ObjectId.isValid(userId)) {
    throwError('Invalid user id', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        accountStatus: payload.accountStatus,
      },
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!updatedUser) {
    throwError('User not found', 404);
  }

  await sendApprovalEmailIfFullyApproved(String(updatedUser?._id));

  return updatedUser;
};

const deleteUserIntoDB = async (userId: string) => {
  const user = await User.findById(userId);

  if (!user) {
    throwError('User not found', 404);
  }

  await User.findByIdAndDelete(userId);

  return { message: 'User deleted successfully' };
};

export const adminService = {
  updateUserApprovalStatusIntoDB,
  updateUserLicenseVerificationStatusIntoDB,
  updateUserAccountStatusIntoDB,
  deleteUserIntoDB,
};