import { Router } from "express";

import { userRoutes } from "../modules/users/user.route";
import { authRoutes } from "../modules/auth/auth.route";
import { listingsRoutes } from "../modules/listings/listings.route";
import { listingPromoteRequestRoutes } from "../modules/listingPromote/listing.promote.route";
import { commissionLedgerRoutes } from "../modules/commissionLedger/commission.ledger.route";
import { adminRoutes } from "../modules/admin/admin.route";
import { listingAssetsRoutes } from "../modules/listingAssets/listing.assets.route";
import { paymentRoutes } from "../modules/payment/payment.route";
import { profileRoutes } from "../modules/profile/profile.route";
import { discountRoutes } from "../modules/discount/discount.route";
import { promoterRoutes } from "../modules/promoters/promoters.routes";
import { dashboardAnalyticsRoutes } from "../modules/dashboardAnalytics/dashboard.analytics.route";
import { challengePillarRoutes } from "../modules/challengePillars/challenge.pillar.route";
import { courseModuleRoutes } from "../modules/courseModules/course.module.route";
import { moduleVideoRoutes } from "../modules/moduleVideos/module.video.route";
import { moduleResourceRoutes } from "../modules/moduleResources/module.resource.route";
// import { userRoutes } from '../modules/user/user.route';
// import { adminRoutes } from '../modules/admin/admin.route';
// import { courseRoutes } from '../modules/course/course.route';

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
  {
    path: "/admin",
    route: adminRoutes,
  },
  {
    path: "/users",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/listings",
    route: listingsRoutes,
  },
  {
    path: "/listings/promote-request",
    route: listingPromoteRequestRoutes,
  },
  {
    path: "/commission",
    route: commissionLedgerRoutes,
  },
  {
    path: "/listing-assets",
    route: listingAssetsRoutes,
  },
  {
    path: "/payments",
    route: paymentRoutes,
  },
  {
    path: "/profile",
    route: profileRoutes,
  },
  {
    path: "/discounts",
    route: discountRoutes,
  },
  {
    path: "/promoters",
    route: promoterRoutes,
  },
  {
    path: "/dashboard",
    route: dashboardAnalyticsRoutes,
  },
  {
    path: '/invictus/challenge-pillars',
    route: challengePillarRoutes,
  },

  {
    path: '/invictus/course-modules',
    route: courseModuleRoutes,
  },
  {
    path:'/invictus/module-videos',
    route: moduleVideoRoutes
  },
  {
    path:'/invictus/module-resources',
    route:moduleResourceRoutes
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
