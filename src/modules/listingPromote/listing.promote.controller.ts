import { NextFunction, Request, Response } from "express";
import { listingPromoteRequestRoutes } from "./listing.promote.route";
import { listingPromoteRequestService } from "./listing.promote.service";
import sendResponse from "../../utility/sendResponse";

const createListingPromoteRequest = async(req : Request, res : Response, next : NextFunction) => {
    try {

        const payload = req.body;
        const result = await  listingPromoteRequestService.createPromoteRequestInDB(payload);

        sendResponse(res, {
            statusCode: 200,
            success : true,
            message : "Listing Promote Request created successfully",
            data : result
        })  
    } catch (error) {
        next(error)
    }

};

const getAllListingPromoteRequest = async (req : Request, res : Response, next : NextFunction) => {

     try {
        const query = req.query;
        const result = await  listingPromoteRequestService.getAllListingPromoteRequest(query);
        
        sendResponse(res, {
            statusCode: 200,
            success : true,
            message : "Listing Promote Request retrived successfully",
            data : result
        })  
    } catch (error) {
        next(error)
    }

}
const getMyListingsPromoteRequest = async (req : Request, res : Response, next : NextFunction) => {

     try {
        const associate_id = req.user?.id;
        console.log(associate_id)
        const query  = req.query;
        const result = await  listingPromoteRequestService.getMyListingsPromoteRequestFromDB(associate_id as string, query);

        sendResponse(res, {
            statusCode: 200,
            success : true,
            message : "Sucessfully fatched your listings",
            data : result
        })  
    } catch (error) {
        next(error)
    }

}

const manageListingPromoteRequest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const { status, confirmed_commission_pct } = req.body;
    const associateId = req.user?.id; // wherever your auth middleware attaches it — adjust if different
 

    console.log(id, associateId)

    if (!status || !["approved", "rejected"].includes(status)) {
      
    return  sendResponse(res, {
        statusCode : 400,
        success : false,
        message : "status must be either 'approved' or 'rejected",
        data : null
      })
    }
 
    const result = await listingPromoteRequestService.manageListingPromoteRequestInDB(
      id as string,
      associateId as string,
      { status, confirmed_commission_pct }
    );
 
    res.status(200).json({
      success: true,
      message: `Promote request ${status} successfully`,
      data: result,
    });

  } catch (error) {
    next(error);
  }
};

export const listingPromoteRequestController = {
    createListingPromoteRequest,
    getAllListingPromoteRequest,
    getMyListingsPromoteRequest,
    manageListingPromoteRequest
}