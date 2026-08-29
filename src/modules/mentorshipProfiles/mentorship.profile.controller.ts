import type { NextFunction, Request, Response } from "express";

import sendResponse from "../../utility/sendResponse";
import assertFound from "../../utility/assertFound";

import {
  ICreateMentorshipProfile,
  IUpdateMentorshipProfile,
} from "./mentorship.profile.interface";

import { mentorshipProfileService } from "./mentorship.profile.service";

const getAuthUser = (
  req: Request,
): {
  id: string;
  role: string;
} => {
  assertFound(req.user, "Authentication required", 401);

  return {
    id: req.user.id as string,
    role: req.user.role as string,
  };
};

const createMentorshipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const profile = await mentorshipProfileService.createMentorshipProfile(
      req.body as ICreateMentorshipProfile,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Mentorship profile created successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const getAllMentorshipProfiles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = req.user
      ? { role: req.user.role as string }
      : undefined;

    let isActive: boolean | undefined;

    if (req.query.isActive === "true" || req.query.isActive === "false") {
      isActive = req.query.isActive === "true";
    }

    const profiles = await mentorshipProfileService.getAllMentorshipProfiles({
      actorRole: authUser?.role,
      isActive,
    });

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profiles retrieved successfully",
      data: profiles,
    });
  } catch (error) {
    next(error);
  }
};

const getPrimaryMentor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const profile = await mentorshipProfileService.getPrimaryMentor();

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Primary mentor retrieved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleMentorshipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const actorRole = req.user?.role as string | undefined;

    const profile = await mentorshipProfileService.getSingleMentorshipProfile(
      String(req.params.id),
      actorRole,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile retrieved successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const updateMentorshipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const profile = await mentorshipProfileService.updateMentorshipProfile(
      String(req.params.id),
      req.body as IUpdateMentorshipProfile,
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile updated successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const publishMentorshipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const profile = await mentorshipProfileService.publishMentorshipProfile(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile published successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const moveMentorshipProfileToDraft = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const profile =
      await mentorshipProfileService.moveMentorshipProfileToDraft(
        String(req.params.id),
        authUser.id,
      );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile moved to draft successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const archiveMentorshipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const profile = await mentorshipProfileService.archiveMentorshipProfile(
      String(req.params.id),
      authUser.id,
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Mentorship profile archived successfully",
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

const selectCoMentor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const member = await mentorshipProfileService.selectMyCoMentor(
      authUser.id,
      String((req.body as { mentorshipProfileId: string }).mentorshipProfileId),
    );

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Co-mentor selected successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

const getMyCoMentor = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const authUser = getAuthUser(req);

    const member = await mentorshipProfileService.getMyCoMentor(authUser.id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Co-mentor retrieved successfully",
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const mentorshipProfileController = {
  createMentorshipProfile,

  getAllMentorshipProfiles,
  getPrimaryMentor,
  getSingleMentorshipProfile,

  updateMentorshipProfile,

  publishMentorshipProfile,
  moveMentorshipProfileToDraft,
  archiveMentorshipProfile,

  selectCoMentor,
  getMyCoMentor,
};