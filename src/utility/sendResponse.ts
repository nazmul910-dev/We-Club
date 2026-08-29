import { Response } from "express";


type responseType<T> = {
    statusCode: number;
    success: boolean;
    message: string;
    data?: T,
    error?: any,
    paid?: boolean
}

const sendResponse = <T>(res: Response, data: responseType<T>) => {
    const { statusCode, success, message, data: responseData, error, paid } = data;
    res.status(statusCode).json({
        success,
        message,
        data: responseData,
        error,
        paid
    })
}

export default sendResponse;