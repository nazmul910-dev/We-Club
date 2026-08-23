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
import { mentorBookingRoutes } from "../modules/mentorBookings/mentor.booking.route";
import { retreatBatchRoutes } from "../modules/retreatBatches/retreat.batch.route";
import { retreatBookingRoutes } from "../modules/retreatBookings/retreat.booking.route";
import { paymentPlanRoutes } from "../modules/paymentPlans/payment.plan.route";
import { invictusPaymentRoutes } from "../modules/invictus-payments/invictus.payment.route";
import { notificationRoutes } from "../modules/notifications/notification.route";
import { notificationTemplateRoutes } from "../modules/notificationTemplates/notification.template.route";
import { entitlementLogRoutes } from "../modules/entitlementLogs/entitlementlog.route";
import { activityLogRoutes } from "../modules/activitylogs/activitylog.route";
import { sessionScheduleRoutes } from "../modules/sessionSchedules/sessionschedules.route";
import { sessionAttendanceRoutes } from "../modules/sessionattendances/sessionattendances.route";
import { supportTicketRoutes } from "../modules/supportTickets/support.ticket.route";
import { userDeviceRoutes } from "../modules/userDevices/user.device.route";
import { streakLogRoutes } from "../modules/streakLogs/streaklog.route";
import { pointsLedgerRoutes } from "../modules/pointsLedger/pointsledger.route";

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
    path: "/invictus",
    route: leaderboardEntryRoutes,
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes,
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
    path: "/invictus/mentor-bookings",
    route: mentorBookingRoutes,
  },
  {
    path: "/invictus/retreat-locations",
    route: retreatLocationRoutes,
  },
  {
    path: "/invictus/retreat-batches",
    route: retreatBatchRoutes,
  },
  {
    path: "/invictus/retreat-bookings",
    route: retreatBookingRoutes,
  },
  {
    path: "/invictus/payment-plans",
    route: paymentPlanRoutes,
  },
  {
    path: "/invictus/payments",
    route: invictusPaymentRoutes,
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardEntryRoutes,
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
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
    path: "/invictus/mentor-bookings",
    route: mentorBookingRoutes,
  },
  {
    path: "/invictus/retreat-locations",
    route: retreatLocationRoutes,
  },
  {
    path: "/invictus/retreat-batches",
    route: retreatBatchRoutes,
  },
  {
    path: "/invictus/retreat-bookings",
    route: retreatBookingRoutes,
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardEntryRoutes,
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/leaderboards",
    route: leaderboardRoutes
  },
  {
    path: "/invictus/notifications",
    route: notificationRoutes,
  },
  {
    path: "/invictus/notification-templates",
    route: notificationTemplateRoutes,
  },
   
  {
    path: "/invictus/entitlement-logs",
    route: entitlementLogRoutes,
  },
  {
    path: "/invictus/activity-logs",
    route: activityLogRoutes,
  },
  {
    path: "/invictus/session-schedules",
    route: sessionScheduleRoutes,
  },
  {
    path: "/invictus/session-attendances",
    route: sessionAttendanceRoutes,
  },











  

  {
    path: "/support-tickets",
    route: supportTicketRoutes,
  },
  {
    path: "/user-devices",
    route: userDeviceRoutes,
  },
  {
    path: "/invictus/streak-logs",
    route: streakLogRoutes,
  },
  {
    path: "/invictus/points-ledger",
    route: pointsLedgerRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;
