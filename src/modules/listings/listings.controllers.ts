import { NextFunction, Request, Response } from "express";
import { listingsService } from "./listings.service";
import sendResponse from "../../utility/sendResponse";



const createListing = async(req: Request, res : Response, next : NextFunction) => {
    try {
        const payload = req.body;


        const result = await listingsService.createListingInDB(payload);

        sendResponse(res, {
            statusCode : 201,
            success : true,
            message : "Listing created successfully",
            data : result,
        })
        
    } catch (error) {
        next(error)
    }
};

const getAllListing =async (req: Request, res : Response, next : NextFunction) => {
    try {
        const query = req.query;
        
        const result = await  listingsService.getAllListingFromDB(query);
          sendResponse(res, {
            statusCode : 200,
            success : true,
            message : "Listing retrived successfully",
            data : result,
        })
        
    } catch (error) {
        next(error)
    }
}
const getMyListings =async (req: Request, res : Response, next : NextFunction) => {
    try {
      
        const userId = req.user?.id
       
        
        const result = await  listingsService.getMyListingFromDB(userId as string);
          sendResponse(res, {
            statusCode : 200,
            success : true,
            message : "Listing retrived successfully",
            data : result,
        })
        
    } catch (error) {
        next(error)
    }
}


export const listingController = {
    createListing,
    getAllListing,
    getMyListings
}