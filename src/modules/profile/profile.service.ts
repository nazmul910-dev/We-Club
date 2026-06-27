import config from '../../config';
import { uploadImageToCloudinary } from '../../utility/cloudinaryUpload';
import { User } from '../users/users.model.schema';
import {
  SocialLinkPlatform,
  UpdateBasicProfilePayload,
  UpdateBioPayload,
  UpdateMarketingChannelsPayload,
  UpsertSocialLinkPayload,
} from './profile.validation';

const throwError = (message: string, statusCode: number): never => {
  const error = new Error(message) as Error & { statusCode?: number };
  error.statusCode = statusCode;
  throw error;
};

const ensureUserExists = <T>(user: T | null | undefined): NonNullable<T> => {
  if (user == null) {
    throwError('User not found', 404);
  }

  return user as NonNullable<T>;
};

const getDefaultProfileImage = (): string => {
  return (
    config.DEFAULT_PROFILE_IMAGE_URL ||
    'https://res.cloudinary.com/demo/image/upload/v1/default-profile.png'
  );
};

const formatProfileResponse = <T extends Record<string, any>>(user: T) => {
  return {
    ...user,
    profileImage: user.profileImage || getDefaultProfileImage(),
  };
};

const getMyProfileFromDB = async (userId: string) => {
  const user = await User.findById(userId).select('-password').lean();

  if (!user) {
    throwError('User not found', 404);
  }

  const safeUser = ensureUserExists(user);

  return formatProfileResponse(safeUser);
};

const updateBasicProfileIntoDB = async (
  userId: string,
  payload: UpdateBasicProfilePayload
) => {
  const updateData: Record<string, unknown> = {};

  const allowedFields: Array<keyof UpdateBasicProfilePayload> = [
    'fullName',
    'brokerage',
    'phone',
    'city',
    'country',
  ];

  allowedFields.forEach((field) => {
    const value = payload[field];

    if (value !== undefined) {
      updateData[field] = value;
    }
  });

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: updateData,
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const updateBioIntoDB = async (userId: string, payload: UpdateBioPayload) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        bio: payload.bio,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const upsertSocialLinkIntoDB = async (
  userId: string,
  payload: UpsertSocialLinkPayload
) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        [`socialLinks.${payload.platform}`]: payload.url,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const deleteSocialLinkFromDB = async (
  userId: string,
  platform: SocialLinkPlatform
) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        [`socialLinks.${platform}`]: '',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const updateMarketingChannelsIntoDB = async (
  userId: string,
  payload: UpdateMarketingChannelsPayload
) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        marketingChannels: payload.marketingChannels,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const updateProfileImageIntoDB = async (
  userId: string,
  file: Express.Multer.File
) => {
  const profileImageUrl = await uploadImageToCloudinary(
    file,
    'newaza/profile-images'
  );

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $set: {
        profileImage: profileImageUrl,
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

const deleteProfileImageFromDB = async (userId: string) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      $unset: {
        profileImage: '',
      },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  )
    .select('-password')
    .lean();

  const safeUpdatedUser = ensureUserExists(updatedUser);

  return formatProfileResponse(safeUpdatedUser);
};

export const profileService = {
  getMyProfileFromDB,
  updateBasicProfileIntoDB,
  updateBioIntoDB,
  upsertSocialLinkIntoDB,
  deleteSocialLinkFromDB,
  updateMarketingChannelsIntoDB,
  updateProfileImageIntoDB,
  deleteProfileImageFromDB,
};