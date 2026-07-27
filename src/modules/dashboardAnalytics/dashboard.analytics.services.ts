import { Types } from "mongoose";

import { IDashboardStats } from "./dashboard.analytics.interface";
import { Promoter } from "../promoters/promoters.model.schema";
import { Listing } from "../listings/listings.model.schema";
import { CommissionLedger } from "../commissionLedger/commission.ledger.model.schema";
import { UserRole } from "../users/user.interface";
import { ListingViewStats } from "../listings/listings.viewsHistory.modal.schema";

const isAdminOrManager = (role: UserRole): boolean =>
  role === "admin" || role === "manager";

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

const getListingsViewsAnalytics = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /**
   * TOTAL VIEWS
   */
  const totalViewsResult = await Listing.aggregate([
    {
      $group: {
        _id: null,
        total: {
          $sum: "$listings_view",
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
        date: {
          $gte: sevenDaysAgo,
          $lte: today,
        },
      },
    },
    {
      $group: {
        _id: "$date",
        value: {
          $sum: "$views",
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

    const found = dailyResult.find(
      (item) => new Date(item._id).toDateString() === date.toDateString(),
    );

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

    const end = new Date(today);

    end.setDate(today.getDate() - week * 7);

    const result = await ListingViewStats.aggregate([
      {
        $match: {
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
            $sum: "$views",
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
    const start = new Date(today.getFullYear(), today.getMonth() - i, 1);

    const end = new Date(today.getFullYear(), today.getMonth() - i + 1, 0);

    end.setHours(23, 59, 59, 999);

    const result = await ListingViewStats.aggregate([
      {
        $match: {
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
            $sum: "$views",
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
   * Average
   */

  const average =
    daily.reduce((sum, item) => sum + item.value, 0) / daily.length;

  /**
   * Growth
   */

  let growth = 0;

  if (daily.length >= 2) {
    const firstDay = daily[0];
    const lastDay = daily[daily.length - 1];

    if (firstDay && lastDay && firstDay.value > 0) {
      growth = ((lastDay.value - firstDay.value) / firstDay.value) * 100;
    }
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
