import { Response } from "express";


type responseType<T> = {
    statusCode : number;
    success: boolean;
    message : string;
    data? : T,
    error? : any
}

const sendResponse = <T>(res : Response, data : responseType<T>) => {
    const { statusCode, success, message, data: responseData, error } = data;
    res.status(statusCode).json({
        success,
        message,
        data: responseData,
        error
    })
}

export default sendResponse;