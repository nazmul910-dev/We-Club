import type { NextFunction, Request, Response } from "express";

import assertFound from "../../utility/assertFound";
import sendResponse from "../../utility/sendResponse";
import { userDeviceService } from "./user.device.service";

const auth = (req: Request) => { assertFound(req.user, "Authentication required", 401); return req.user; };


const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const data = await userDeviceService.register(user.id, req.body);
    sendResponse(res,
      {
        statusCode: 200,
        success: true,
        message: "Device registered successfully",
        data
      });
  } catch (error) {
    next(error);
  }
}


const list = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const data = await userDeviceService.list(user.id);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Devices retrieved successfully",
      data
    });
  } catch (error) {
    next(error);
  }
}

const revoke = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = auth(req);
    const data = await userDeviceService.revoke(user.id, String(req.params.id));
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Device revoked successfully",
      data
    });
  } catch (error) {
    next(error);
  }
}

export const userDeviceController = {
  register,
  list,
  revoke,
};
