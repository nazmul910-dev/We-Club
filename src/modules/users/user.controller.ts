import { NextFunction, Request, Response } from "express";
import { userService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";

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

export const userController = { getAllUsers };