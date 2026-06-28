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

const getListingById  = async(req : Request, res : Response, next : NextFunction) => {
     try {
        const {id} = req.params;
        const result = await  listingsService.getListingByIdFromDB(id as string );

        sendResponse(res, {
            statusCode: 200,
            success : true,
            message : "Listing retrieved successfully",
            data : result
        })  
    } catch (error) {
        next(error)
    }


}

const updateListing = async (req: Request, res: Response, next : NextFunction) => {
  try {

    const {id} = req.params
    const associateId = req.user?.id;

    // console.log(req.body)
 
    const results = await listingsService.updateListingInDB(id as string, associateId as string, req.body);
 
    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: results,
    });

  } catch (error) {
    next(error)
  }
};

const deleteListing = async (req: Request, res: Response, next : NextFunction) => {
  try {

    const {id} = req.params
    const userId = req.user?.id;
    const role = req.user?.role;

    //  console.log(id, req.user, role)
 
    const results = await listingsService.deleteListingFromDB(id as string, userId as string, role as string);
 
    res.status(200).json({
      success: true,
      message: "Listing deleted successfully",
      data: results,
    });

  } catch (error) {
    next(error)
  }
};

export const listingController = {
    createListing,
    getAllListing,
    getMyListings,
    updateListing,
    getListingById,
    deleteListing
}