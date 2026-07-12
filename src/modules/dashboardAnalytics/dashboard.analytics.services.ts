import { Types } from "mongoose";

import { IDashboardStats } from "./dashboard.analytics.interface";
import { Promoter } from "../promoters/promoters.model.schema";
import { Listing } from "../listings/listings.model.schema";
import { CommissionLedger } from "../commissionLedger/commission.ledger.model.schema";
import { UserRole } from "../users/user.interface";

 
const isAdminOrManager = (role: UserRole): boolean =>
  role === "admin" || role === "manager";
 
const getDashboardStats = async (
  userId: string,
  role: UserRole,
): Promise<IDashboardStats> => {
  const ownerId = new Types.ObjectId(userId);
  const isPrivileged = isAdminOrManager(role);
 
  // Computed once, reused across every aggregation below — an empty match
  // object means "no filter" (i.e. everything), so admins/managers get
  // platform-wide totals with zero extra branching per query.
  
  const listingMatch: Record<string, unknown> = isPrivileged
    ? {}
    : { associate_id: ownerId };
 
  const commissionMatch: Record<string, unknown> = {
    status: "pending",
    ...(isPrivileged ? {} : { listing_owner_id: ownerId }),
  };
 
  const promoterListingsMatch: Record<string, unknown> = isPrivileged
    ? {}
    : { user_id: ownerId };
 
  const [
    listingStats,
    totalPromotersPlatformWide,
    distinctPromotersOfMyListings,
    propertiesShared,
    commissionStats,
  ] = await Promise.all([
    Listing.aggregate([
      { $match: listingMatch },
      {
        $group: {
          _id: null,
          total_listings: { $sum: 1 },
          listing_value: { $sum: "$price.amount" },
          listing_views: { $sum: "$listings_view" },
        },
      },
    ]),
 
    // Platform-wide count — this is what admin/manager should actually see.
    Promoter.countDocuments(),
 
    // NOTE: the original code used this exact same Promoter.countDocuments()
    // value for `total_promoters` regardless of role — meaning a regular
    // associate was ALSO seeing the platform-wide total, not "how many
    // promoters are working my listings," which seems like the more
    // meaningful number for them. Fixed by counting distinct promoters
    // whose `promoters` entry appears on this user's own listings instead.
    // If you actually want the platform-wide count for everyone regardless
    // of role, just drop this query and always use the one above.
    Listing.distinct("promoters.user_id", listingMatch),
 
    // Also switched $project → $group + $sum here: $project only handles
    // the case where exactly one Promoter document matches (true for a
    // single associate, since there's one Promoter doc per user). For the
    // admin/manager platform-wide case, multiple Promoter documents match,
    // and $project would silently only reflect one of them. $group sums
    // across however many documents matched, correct in both cases.
    Promoter.aggregate([
      { $match: promoterListingsMatch },
      {
        $group: {
          _id: null,
          total: { $sum: { $size: "$listings" } },
        },
      },
    ]),
 
    CommissionLedger.aggregate([
      { $match: commissionMatch },
      {
        $group: {
          _id: null,
          total: { $sum: "$estimated_commission_amount" },
        },
      },
    ]),
  ]);
 
  return {
    total_listings: listingStats[0]?.total_listings ?? 0,
 
    // NOTE: these previously defaulted to `?? 100` instead of `?? 0` —
    // meaning a user/org with genuinely zero listing value, zero views, or
    // zero commission pipeline would have shown a fake "100" instead of an
    // honest zero. Fixed to `?? 0`, matching total_listings' own fallback.
    listing_value: listingStats[0]?.listing_value ?? 0,
    listing_views: listingStats[0]?.listing_views ?? 0,
 
    total_promoters: isPrivileged
      ? totalPromotersPlatformWide
      : distinctPromotersOfMyListings.length,
 
    properties_shared_with_me: propertiesShared[0]?.total ?? 0,
 
    commission_pipeline: commissionStats[0]?.total ?? 0,
    top_promoters: [],
  };
};

// const getDashboardStats = async (userId: string): Promise<IDashboardStats> => {

//   const ownerId = new Types.ObjectId(userId);


//   const [listingStats, promoterStats, propertiesShared, commissionStats] =
//     await Promise.all([
//       Listing.aggregate([
//         {
//           $match: {
//             associate_id: ownerId,
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total_listings: { $sum: 1 },
//             listing_value: { $sum: "$price.amount" },
//             listing_views: { $sum: "$listings_view" },
//           },
//         },
//       ]),

//       Promoter.countDocuments(),

//       Promoter.aggregate([
//         {
//           $match: {
//             user_id: ownerId,
//           },
//         },
//         {
//           $project: {
//             _id: 0,
//             total: {
//               $size: "$listings",
//             },
//           },
//         },
//       ]),

//       CommissionLedger.aggregate([
//         {
//           $match: {
//             listing_owner_id: ownerId,
//             status: "pending",
//           },
//         },
//         {
//           $group: {
//             _id: null,
//             total: {
//               $sum: "$estimated_commission_amount",
//             },
//           },
//         },
//       ]),
//     ]);


//   return {
//     total_listings: listingStats[0]?.total_listings ?? 0,

//     listing_value: listingStats[0]?.listing_value ?? 100,

//     listing_views: listingStats[0]?.listing_views ?? 100,

//     total_promoters: promoterStats ?? 0,

//     properties_shared_with_me: propertiesShared[0]?.total ?? 0,

//     commission_pipeline: commissionStats[0]?.total ?? 100,
//     top_promoters: [],
//   };
// };

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
