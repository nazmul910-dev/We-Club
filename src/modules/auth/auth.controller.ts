import { Request, Response, NextFunction } from "express";
import * as authService from "./auth.service";
import sendResponse from "../../utility/sendResponse";

const createUserInDB = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await authService.createUser(req.body);
        sendResponse(res, {
            statusCode : 201,
            success: true,
            message : "User created successfully",
            data : result
        });
    } catch (error) {
        next(error);
    }
};

const loginUserInDB = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);
       sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "User logged in successfully",
        data : result
       });
    } catch (error) {
        next(error);
    }
};


export const authController = { createUserInDB, loginUserInDB,  };