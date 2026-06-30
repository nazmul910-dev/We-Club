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

        const result = await authService.loginUser(req.body);

        const {refreshToken,accessToken} = result;

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days milliseconds
    });

       sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "User logged in successfully",
        data : {
            token: accessToken,
            user: result.user
        }
       });
    } catch (error) {
        next(error)
        }
};

const changePassword = async(req:Request,res:Response,next:NextFunction) =>{
    try {
        console.log("user2:",req.user)
        console.log("user3:",req.body)
        const result = await authService.changePassword( req.user!, req.body);
        sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "Password changed successful",
        data : result
       });
    } catch (error) {
        next(error);
    }
}

const forgetPassword = async(req:Request,res:Response,next:NextFunction) =>{
    try {
        const result = await authService.forgetPassword(req.body.email);
        sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "Please check your email",
        data : result
       });
    } catch (error) {
        next(error);
    }
}


const resetPassword = async(req:Request, res:Response, next:NextFunction) =>{
    try {
        const token = req.headers.authorization as string;
        const result = await authService.resetPassword(req.body, token);
        sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "Password has been reset",
        data : result
       });
    } catch (error) {
        next(error)
    }
}

const refreshtoken = async(req:Request, res:Response, next:NextFunction) =>{
    try {
        const result = await authService.refreshtoken(req.cookies.refreshToken);

        sendResponse(res, {
        statusCode : 200,
        success: true,   
        message : "Token is refreshed successful",
        data : result
       });       
    } catch (error) {
        next(error)
    }
}


export const authController = { createUserInDB, loginUserInDB, changePassword, forgetPassword,resetPassword,refreshtoken };