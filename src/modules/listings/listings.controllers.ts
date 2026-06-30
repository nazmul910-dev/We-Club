import { NextFunction, Request, Response } from "express";
import { listingsService } from "./listings.service";
import sendResponse from "../../utility/sendResponse";
import { uploadImageToCloudinary } from "../../utility/cloudinaryUpload";
import { json } from "zod";

const LISTING_IMAGE_TRANSFORM = [{ quality: "auto", fetch_format: "auto" }];


const createListing = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      cover_image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    let cover_image: string | undefined;
    let images: string[] = [];

    if (files?.cover_image?.[0]) {
      cover_image = await uploadImageToCloudinary(
        files.cover_image[0],
        "listings/cover"
      );
    }

    if (files?.images?.length) {
      images = await Promise.all(
        files.images.map((file) =>
          uploadImageToCloudinary(file, "listings/gallery")
        )
      );
    }

    // parse stringified JSON fields coming from form-data
    const parseIfString = (val: any) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return val;
        }
      }
      return val;
    };

    const body = {
      ...req.body,
      location: parseIfString(req.body.location),
      price: parseIfString(req.body.price),
      referral_commission: parseIfString(req.body.referral_commission),
    };

    const listing = await listingsService.createListingInDB({
      ...body,
      ...(cover_image && { cover_image }),
      ...(images.length > 0 && { images }),
    });

    res.status(201).json({
      success: true,
      message: "Listing created successfully",
      data: listing,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "Failed to create listing",
    });
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

const updateListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const associateId = req.user?.id;



    // req.files comes from the uploadListingImages multer middleware:
    // upload.fields([{ name: "cover_image" }, { name: "images" }])
    const files = req.files as {
      cover_image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    console.log(files)
    let cover_image: string | undefined;
    let images: string[] | undefined;

    console.log("assets from the listings ", cover_image, images)

    if (files?.cover_image?.[0]) {
      cover_image = await uploadImageToCloudinary(
        files.cover_image[0],
        "listings/cover",
        
      );
    }

    if (files?.images?.length) {
      images = await Promise.all(
        files.images.map((file) =>
          uploadImageToCloudinary(file, "listings/gallery")
        )
      );
    }

    const updatePayload = {
      ...req.body,
      ...(cover_image && { cover_image }),
      ...(images && { images }),
    };

    console.log("updated payload ...",updatePayload)

    const results = await listingsService.updateListingInDB(
      id as string,
      associateId as string,
      updatePayload
    );

    res.status(200).json({
      success: true,
      message: "Listing updated successfully",
      data: results,
    });
  } catch (error) {
    next(error);
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