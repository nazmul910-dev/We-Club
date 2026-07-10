import { Types } from "mongoose";

import { IDashboardStats } from "./dashboard.analytics.interface";
import { Promoter } from "../promoters/promoters.model.schema";
import { Listing } from "../listings/listings.model.schema";
import { CommissionLedger } from "../commissionLedger/commission.ledger.model.schema";

const getDashboardStats = async (userId: string): Promise<IDashboardStats> => {
  console.log(userId);
  const ownerId = new Types.ObjectId(userId);

  console.log("user data ", ownerId);

  const [listingStats, promoterStats, propertiesShared, commissionStats] =
    await Promise.all([
      Listing.aggregate([
        {
          $match: {
            associate_id: ownerId,
          },
        },
        {
          $group: {
            _id: null,
            total_listings: { $sum: 1 },
            listing_value: { $sum: "$price.amount" },
            listing_views: { $sum: "$listings_view" },
          },
        },
      ]),

      Promoter.countDocuments(),

      Promoter.aggregate([
        {
          $match: {
            user_id: ownerId,
          },
        },
        {
          $project: {
            _id: 0,
            total: {
              $size: "$listings",
            },
          },
        },
      ]),

      CommissionLedger.aggregate([
        {
          $match: {
            listing_owner_id: ownerId,
            status: "pending",
          },
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: "$estimated_commission_amount",
            },
          },
        },
      ]),
    ]);

  console.log(propertiesShared);

  return {
    total_listings: listingStats[0]?.total_listings ?? 0,

    listing_value: listingStats[0]?.listing_value ?? 100,

    listing_views: listingStats[0]?.listing_views ?? 100,

    total_promoters: promoterStats ?? 0,

    properties_shared_with_me: propertiesShared[0]?.total ?? 0,

    commission_pipeline: commissionStats[0]?.total ?? 100,
    top_promoters: [],
  };
};

const getTopPromoters=async()=>{

    return Listing.aggregate([

        {
            $group:{
                _id:"$associate_id",

                totalViews:{
                    $sum:"$listings_view"
                }
            }
        },

        {
            $sort:{
                totalViews:-1
            }
        },

        {
            $limit:5
        },

        {
            $lookup:{
                from:"users",
                localField:"_id",
                foreignField:"_id",
                as:"user"
            }
        },

        {
            $unwind:"$user"
        },

        {
            $project:{

                _id:0,

                user_id:"$user._id",

                fullName:"$user.fullName",

                profileImage:"$user.profileImage",

                city:"$user.city",

                country:"$user.country",

                totalViews:1
            }
        }

    ]);

}

export const dashboardService = {
  getDashboardStats,
  getTopPromoters,
};
