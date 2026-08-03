import { NextFunction, Request, Response } from "express";
import { userService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

const getSingleParamId = (value: string | string[] | undefined): string | null => {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
};

const getAllUsers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = req.query;

    const result = await userService.getAllUsersFromDB(query);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Users retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const getSingleUser= async (req:Request, res:Response, next:NextFunction) =>{
    try {
        const id = getSingleParamId(req.params.id);

        if (!id) {
            return sendResponse(res, {
                statusCode: 400,
                success: false,
                message: "Invalid user id",
                data: null,
            });
        }

        const result = await userService.getSingleUserFromDB(id);
            sendResponse(res, {
            statusCode : 200,
            success: true,  
            message : "User received successfully",
            data : result
        });
        
        
    } catch (error) {
        next(error)
    }
}

const createManagerByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const requesterId = (req.user as any).id;
    const requesterRole = (req.user as any).role; 

    const result = await userService.createAdminAccount(
      req.body,
      requesterId,
      requesterRole
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Account created successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const deleteManagerByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getSingleParamId(req.params.id);

    if (!id) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null,
      });
    }

    await userService.deleteManagerByAdmin(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Manager deleted successfully.",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const activateManagerByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
       const id = getSingleParamId(req.params.id);

    if (!id) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null,
      });
    }

    const result = await userService.activateManagerByAdmin(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Manager activated successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const suspendManagerByAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = getSingleParamId(req.params.id);

    if (!id) {
      return sendResponse(res, {
        statusCode: 400,
        success: false,
        message: "Invalid manager id",
        data: null,
      });
    }

    const result = await userService.suspendManagerByAdmin(id);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Manager suspended successfully.",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};


export const userController = { getAllUsers,getSingleUser,createManagerByAdmin,deleteManagerByAdmin ,suspendManagerByAdmin,activateManagerByAdmin};