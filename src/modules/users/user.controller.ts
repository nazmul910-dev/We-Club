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

        const users = await userService.getAllUsersFromDB(query);

        if(!users || users.length === 0) {
            return sendResponse(res, {
                statusCode : 404,   
                success: false,
                message : "No users found",
                data : []
            });
        }

        sendResponse(res, {
            statusCode : 200,
            success: true,  
            message : "Users retrieved successfully",
            data : users
        });

    }catch (error) {
       next(error);
    }
}

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
    const adminId = (req.user as any).id;

    const result = await userService.createManagerByAdmin(
      req.body,
      adminId
    );

    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "Manager created successfully.",
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