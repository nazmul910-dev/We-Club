import { NextFunction, Request, Response } from "express";
import { userService } from "./auth.service";
import sendResponse from "../../utility/sendResponse";
import { string } from "zod";

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
        
        const id = req.params.id;
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

export const userController = { getAllUsers,getSingleUser };