import { NextFunction, Request, Response } from "express";
import { listingsService } from "./listings.service";
import sendResponse from "../../utility/sendResponse";
import { uploadImageToCloudinary } from "../../utility/cloudinaryUpload";
import { json } from "zod";
import { parseIfString } from "../../utility/parseIfString";

const LISTING_IMAGE_TRANSFORM = [{ quality: "auto", fetch_format: "auto" }];


const createListing = async (req: Request, res: Response) => {
  try {
    const files = req.files as {
      cover_image?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    // Upload cover_image and ALL gallery images in parallel — not sequentially.
    // Previously: cover upload finished → then gallery uploads started (sequential).
    // Now: all uploads fire at the same time, response time = slowest single upload.
    const [cover_image, ...uploadedImages] = await Promise.all([
      files?.cover_image?.[0]
        ? uploadImageToCloudinary(files.cover_image[0], "listings/cover")
        : Promise.resolve(undefined),

      ...(files?.images ?? []).map((file) =>
        uploadImageToCloudinary(file, "listings/gallery")
      ),
    ]);

    const images = uploadedImages.filter(Boolean) as string[];

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
      message:
        error instanceof Error ? error.message : "Failed to create listing",
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
       const query = req.query
        
        const result = await  listingsService.getMyListingFromDB(userId as string, query);
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

const getMyPromoters = async(req : Request, res : Response, next : NextFunction) => {
    try {
        const userId = req.user?.id;
        const result = await listingsService.getMyPromotersFromDB(userId as string); 
        sendResponse(res, {
            statusCode: 200,
            success : true,
            message : "Promoters retrieved successfully",
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

    let cover_image: string | undefined;
    let images: string[] | undefined;

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

    // multipart/form-data sends every field as a plain string — nested object
    // fields (location, price, referral_commission) arrive as JSON strings and
    // must be parsed before they can be saved into the schema's nested fields.
    const jsonFields = ["location", "price", "referral_commission"];
    const parsedBody: Record<string, unknown> = { ...req.body };

    for (const field of jsonFields) {
      if (typeof parsedBody[field] === "string") {
        try {
          parsedBody[field] = JSON.parse(parsedBody[field] as string);
        } catch {
          return res.status(400).json({
            success: false,
            message: `Invalid JSON format for field "${field}"`,
          });
        }
      }
    }

    const updatePayload = {
      ...parsedBody,
      ...(cover_image && { cover_image }),
      ...(images && { images }),
    };


    console.log(updatePayload)

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

const cancelPendingListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;  

    const results = await listingsService.cancelPendingListingInDB(id as string, userId as string);

    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pending listing canceled successfully",
      data: results,
    });
   
  } catch (error) {
    next(error);
  }
}

const deletePendingListing = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;  
    const results = await listingsService.deletePendingListingInDB(id as string, userId as string);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Pending listing deleted successfully",
      data: results,
    });
  }catch (error) {
  
  next(error)
  }
}

const manageListings = async(req: Request, res: Response, next: NextFunction) => {
  try {
    const {id} = req.params
    const {
      status 
    } = req.body
    const results = await listingsService.manageListings(id as string, status   )
      sendResponse(res, {
        statusCode : 200,
        success : true,
        message : `Listing ${status} updated sucessfull`,
        data : results
      })
  } catch (error) {
    next(error)
  }
}

export const listingController = {
    createListing,
    getAllListing,
    getMyListings,
    updateListing,
    getListingById,
    deleteListing,
    getMyPromoters,
    cancelPendingListing,
    deletePendingListing,
    manageListings
}