import { Types } from "mongoose";

import { IDashboardStats } from "./dashboard.analytics.interface";
import { Promoter } from "../promoters/promoters.model.schema";
import { Listing } from "../listings/listings.model.schema";
import { CommissionLedger } from "../commissionLedger/commission.ledger.model.schema";
import { UserRole } from "../users/user.interface";
import { ListingViewStats } from "../listings/listings.viewsHistory.modal.schema";

const FULL_ANALYTICS_ACCESS_ROLES: UserRole[] = [
  "manager",
  "founder",
  // পরে প্রয়োজন হলে:
  // "admin",
  // "super_admin",
];

const hasFullAnalyticsAccess = (role: UserRole): boolean =>
  FULL_ANALYTICS_ACCESS_ROLES.includes(role);

const isAdminOrManager = (role: UserRole): boolean =>
  role === "manager" || role === "founder" ;

const getDashboardStats = async (
  userId: string,
  role: UserRole,
): Promise<IDashboardStats> => {
  const ownerId = new Types.ObjectId(userId);
  const isPrivileged = isAdminOrManager(role);


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

    Promoter.countDocuments(),


    Listing.distinct("promoters.user_id", listingMatch),


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



const getTopPromoters = async () => {
  return Listing.aggregate([
    {
      $group: {
        _id: "$associate_id",

        totalViews: {
          $sum: "$listings_view",
        },
      },
    },

    {
      $sort: {
        totalViews: -1,
      },
    },

    {
      $limit: 5,
    },

    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },

    {
      $unwind: "$user",
    },

    {
      $project: {
        _id: 0,

        user_id: "$user._id",

        fullName: "$user.fullName",

        profileImage: "$user.profileImage",

        city: "$user.city",

        country: "$user.country",

        totalViews: 1,
      },
    },
  ]);
};

interface IChartData {
  label: string;
  value: number;
}

const getListingsViewsAnalytics = async (
  userId: string,
  role: UserRole,
) => {
  const ownerId = new Types.ObjectId(userId);
  const canViewAllAnalytics = hasFullAnalyticsAccess(role);

  /**
   * Manager/Founder হলে সব listing।
   * অন্য role হলে শুধু নিজের তৈরি listing।
   */
  const listingMatch: Record<string, unknown> = canViewAllAnalytics
    ? {}
    : {
        associate_id: ownerId,
      };

  /**
   * সাধারণ user-এর listing IDs বের করা হচ্ছে।
   * ListingViewStats-এর data filter করতে এগুলো প্রয়োজন।
   */
  const listingIds = canViewAllAnalytics
    ? []
    : await Listing.distinct("_id", listingMatch);


//     console.log("Analytics debug:", {
//   role,
//   userId,
//   canViewAllAnalytics,
//   listingIds: listingIds.map((id) => id.toString()),
// });

// const userViewStats = await ListingViewStats.find(
//   canViewAllAnalytics
//     ? {}
//     : {
//         listing_id: {
//           $in: listingIds,
//         },
//       },
// )
//   .select("listing_id date views")
//   .lean();

// console.log("Matched ListingViewStats:", userViewStats);


// const sampleViewStats = await ListingViewStats.findOne().lean();

// console.log("Sample ListingViewStats:", sampleViewStats);
// console.log(
//   "listing_id type:",
//   sampleViewStats?.listing_id?.constructor?.name,
// );

  /**
   * গুরুত্বপূর্ণ:
   * এখানে ধরে নেওয়া হয়েছে ListingViewStats schema-তে
   * listing_id field রয়েছে।
   */
  const viewStatsMatch: Record<string, unknown> = canViewAllAnalytics
    ? {}
    : {
        listing: {
          $in: listingIds,
        },
      };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  /**
   * TOTAL VIEWS
   *
   * Manager/Founder = সব listing-এর views।
   * অন্য user = নিজের listing-এর views।
   */
  const totalViewsResult = await Listing.aggregate([
    {
      $match: listingMatch,
    },
    {
      $group: {
        _id: null,
        total: {
          $sum: {
            $ifNull: ["$listings_view", 0],
          },
        },
      },
    },
  ]);

  const totalViews = totalViewsResult[0]?.total ?? 0;

  /**
   * LAST 7 DAYS
   */
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 6);

  const daily: IChartData[] = [];
  const weekly: IChartData[] = [];
  const monthly: IChartData[] = [];

  const dailyResult = await ListingViewStats.aggregate([
    {
      $match: {
        ...viewStatsMatch,
        date: {
          $gte: sevenDaysAgo,
          $lte: endOfToday,
        },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m-%d",
            date: "$date",
          },
        },
        value: {
          $sum: {
            $ifNull: ["$views", 0],
          },
        },
      },
    },
    {
      $sort: {
        _id: 1,
      },
    },
  ]);

  for (let i = 0; i < 7; i++) {
    const date = new Date(sevenDaysAgo);
    date.setDate(sevenDaysAgo.getDate() + i);

    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");

    const found = dailyResult.find((item) => item._id === dateKey);

    daily.push({
      label: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      value: found?.value ?? 0,
    });
  }

  /**
   * LAST 4 WEEKS
   */
  for (let week = 3; week >= 0; week--) {
    const start = new Date(today);
    start.setDate(today.getDate() - week * 7 - 6);
    start.setHours(0, 0, 0, 0);

    const end = new Date(today);
    end.setDate(today.getDate() - week * 7);
    end.setHours(23, 59, 59, 999);

    const result = await ListingViewStats.aggregate([
      {
        $match: {
          ...viewStatsMatch,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$views", 0],
            },
          },
        },
      },
    ]);

    weekly.push({
      label: `Week ${4 - week}`,
      value: result[0]?.total ?? 0,
    });
  }

  /**
   * LAST 6 MONTHS
   */
  for (let i = 5; i >= 0; i--) {
    const start = new Date(
      today.getFullYear(),
      today.getMonth() - i,
      1,
    );

    start.setHours(0, 0, 0, 0);

    const end = new Date(
      today.getFullYear(),
      today.getMonth() - i + 1,
      0,
    );

    end.setHours(23, 59, 59, 999);

    const result = await ListingViewStats.aggregate([
      {
        $match: {
          ...viewStatsMatch,
          date: {
            $gte: start,
            $lte: end,
          },
        },
      },
      {
        $group: {
          _id: null,
          total: {
            $sum: {
              $ifNull: ["$views", 0],
            },
          },
        },
      },
    ]);

    monthly.push({
      label: start.toLocaleDateString("en-US", {
        month: "short",
      }),
      value: result[0]?.total ?? 0,
    });
  }

  /**
   * DAILY AVERAGE
   */
  const average =
    daily.length > 0
      ? daily.reduce((sum, item) => sum + item.value, 0) / daily.length
      : 0;

  /**
   * GROWTH
   */
  let growth = 0;

  const firstDay = daily[0];
  const lastDay = daily[daily.length - 1];

  if (firstDay && lastDay && firstDay.value > 0) {
    growth =
      ((lastDay.value - firstDay.value) / firstDay.value) * 100;
  }

  return {
    totalViews,
    daily,
    weekly,
    monthly,
    average: Math.round(average),
    growth: Number(growth.toFixed(2)),
  };
};

export const dashboardService = {
  getDashboardStats,
  getTopPromoters,
  getListingsViewsAnalytics,
};
