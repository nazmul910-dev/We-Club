import { Listing } from "../../modules/listings/listings.model.schema";
import { IListing } from "../../modules/listings/listings.interface";
import { webflowService } from "./webflow.service";
import { mapListingToWebflowFieldData } from "./webflow.mapper";


export const syncListingToWebflow = async (
  listing: IListing & { _id: any },
): Promise<void> => {
  try {
    const fieldData = mapListingToWebflowFieldData(listing);

    if (listing.webflow_item_id) {
      await webflowService.updateProperty(
        listing.webflow_item_id,
        fieldData,
        listing.status,
      );
    } else {
      const item = await webflowService.createProperty(
        fieldData,
        listing.status,
      );

      await Listing.findByIdAndUpdate(listing._id, {
        webflow_item_id: item.id,
      });
    }
  } catch (err) {
    console.error(
      `Webflow sync failed for listing ${listing._id}:`,
      err,
    );
  }
};


export const archiveListingOnWebflow = async (
  listing: IListing & { _id: any },
): Promise<void> => {
  if (!listing.webflow_item_id) return;

  try {
    await webflowService.archiveProperty(listing.webflow_item_id);
  } catch (err) {
    console.error(
      `Webflow archive failed for listing ${listing._id}:`,
      err,
    );
  }
};