import { uploadLogoToCloudinary } from "../../utility/cloudinaryUpload";
import { logo } from "./logo.model.schema";
import { NotFoundError } from "../../utility/errorResponses";

const uploadLogoIntoDB = async (userId: string, file: Express.Multer.File) => {
  const profileImageUrl = await uploadLogoToCloudinary(file, "adam/logo");

  const existingLogo = await logo.findOne();

  if (existingLogo) {
    existingLogo.logo = profileImageUrl;
    await existingLogo.save();
    return existingLogo;
  }

  const result = await logo.create({ logo: profileImageUrl });
  return result;
};

const getLogoFromDB = async () => {
  const result = await logo.findOne();

  if (!result) {
    throw new NotFoundError("Logo not found");
  }

  return result;
};

const changeLogoIntoDB = async (userId: string, file: Express.Multer.File) => {
  const profileImageUrl = await uploadLogoToCloudinary(file, "adam/logo");

  const existingLogo = await logo.findOne();

  if (!existingLogo) {
    const result = await logo.create({ logo: profileImageUrl });
    return result;
  }

  existingLogo.logo = profileImageUrl;
  await existingLogo.save();

  return existingLogo;
};

export const logoService = { uploadLogoIntoDB, getLogoFromDB, changeLogoIntoDB };