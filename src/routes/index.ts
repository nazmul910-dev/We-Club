import { Router } from 'express';

import { userRoutes } from '../modules/users/user.route';
import { authRoutes } from '../modules/auth/auth.route';
import { listingsRoutes } from '../modules/listings/listings.route';
import { listingPromoteRequestRoutes } from '../modules/listingPromote/listing.promote.route';
import { commissionLedgerRoutes } from '../modules/commissionLedger/commission.ledger.route';
import { adminRoutes } from '../modules/admin/admin.route';
import { listingAssetsRoutes } from '../modules/listingAssets/listing.assets.route';
import { paymentRoutes } from '../modules/payment/payment.route';
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
    path: '/admin',
    route: adminRoutes
  },
  {
    path: '/users',
    route: userRoutes
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/listings",
    route: listingsRoutes
  },
  {
    path: "/listings/promote-request",
    route: listingPromoteRequestRoutes
  }
  ,
  {
    path: "/commission",
    route: commissionLedgerRoutes
  },
  {
    path:"/listing-assets",
    route: listingAssetsRoutes
  },
  {
    path:"/payments",
    route: paymentRoutes
  }

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;