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
import { quizQuestionRoutes } from "../modules/quizeQuestions/quiz.question.route";
import { moduleActionRoutes } from "../modules/moduleActions/module.action.route";
// import { userRoutes } from '../modules/user/user.route';
// import { adminRoutes } from '../modules/admin/admin.route';
// import { courseRoutes } from '../modules/course/course.route';
import roomRoutes from "../modules/room/room.route";
import messageRoutes from "../modules/message/message.route";
import { LogoRoutes } from "../modules/manageLogo/logo.route";
import { academyProfileRoutes } from "../modules/academyProfiles/academy.profile.route";
import { userEntitlementRoutes } from "../modules/userEntitlements/userEntitlements.route";
import { videoProgressRoutes } from "../modules/videoProgress/video.progress.route";
import { moduleProgressRoutes } from "../modules/moduleProgress/module.progress.route";
import { quizAttemptRoutes } from "../modules/quizAttempts/quiz.attempt.route";
import { quizCertificateRoutes } from "../modules/quizCertificates/quiz.certificate.route";
import { mentorshipProfileRoutes } from "../modules/mentorshipProfiles/mentorship.profile.route";
import { mentorshipReviewRoutes } from "../modules/mentorshipReviews/mentorship.review.route";
import { retreatLocationRoutes } from "../modules/retreatLocations/retreat.location.route";
import { leaderboardEntryRoutes } from "../modules/leaderboardEntries/leaderboard.entry.route";
import { leaderboardRoutes } from "../modules/leaderboards/leaderboard.route";
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
    path: "/invictus/challenge-pillars",
    route: challengePillarRoutes,
  },

  {
    path: "/invictus/course-modules",
    route: courseModuleRoutes,
  },
  {
    path: "/invictus/module-videos",
    route: moduleVideoRoutes,
  },
  {
    path: "/invictus/module-resources",
    route: moduleResourceRoutes,
  },
  {
    path: "/invictus/quiz-questions",
    route: quizQuestionRoutes,
  },
  {
    path: "/invictus/module-actions",
    route: moduleActionRoutes,
  },
  {
    path: "/rooms",
    route: roomRoutes,
  },
  {
    path: "/messages",
    route: messageRoutes,
  },
  {
    path: "/logo",
    route: LogoRoutes,
  },
  {
    path: "/invictus/academy-profile",
    route: academyProfileRoutes,
  },
  {
    path: "/invictus/user-entitlements",
    route: userEntitlementRoutes,
  },
  {
    path: "/invictus/video-progress",
    route: videoProgressRoutes,
  },
  {
    path: "/invictus/module-progress",
    route: moduleProgressRoutes,
  },
  {
    path: "/invictus/quiz-attempts",
    route: quizAttemptRoutes,
  },
  {
    path: "/invictus/quiz-certificates",
    route: quizCertificateRoutes,
  },
  {
    path: "/invictus/mentorship-profiles",
    route: mentorshipProfileRoutes,
  },
  {
    path: "/invictus/mentorship-reviews",
    route: mentorshipReviewRoutes,
  },
  {
    path: "/invictus/retreat-locations",
    route: retreatLocationRoutes,
  },
  {
    path:"/invictus",
    route:leaderboardEntryRoutes,
  },
  {
    path:"/invictus/leaderboards",
    route:leaderboardRoutes,
  }
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
