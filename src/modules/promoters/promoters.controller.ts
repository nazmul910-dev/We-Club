import { NextFunction, Request, Response } from "express";
import { promotersServices } from "./promoters.services";
import sendResponse from "../../utility/sendResponse";

const getPromoters = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

    try {
        const query = req.query
        const results = await promotersServices.getPromotersFromDB(query);
        sendResponse(res, {
            statusCode : 200,
            success : false,
            message : "Promoters data retrived successfully",
            data : results
        })
    } catch (error) {
        next(error)
    }


};

export const promotersController = {
  getPromoters,
};
