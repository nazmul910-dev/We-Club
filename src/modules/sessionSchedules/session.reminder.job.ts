import cron from "node-cron";
import { SessionSchedule } from "./sessionschedules.model.schema";
import { SessionAttendance } from "../sessionattendances/sessionattendances.model.schema";
import { notificationService } from "../notifications/notification.service";

const REMINDER_WINDOW_MINUTES = 30; 


const runSessionReminderSweep = async () => {
  const now = new Date();
  const windowStart = new Date(now.getTime() + (REMINDER_WINDOW_MINUTES - 1) * 60_000);
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_MINUTES * 60_000);

  const upcomingSessions = await SessionSchedule.find({
    status: "scheduled",
    startTime: { $gte: windowStart, $lte: windowEnd },
  }).select("_id title startTime meetingUrl");

  if (upcomingSessions.length === 0) return;

  for (const session of upcomingSessions) {
    const registrants = await SessionAttendance.find({
      session: session._id,
      status: "registered",
    }).select("user");

    const startTimeLabel = session.startTime.toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "UTC",
    });

    await Promise.all(
      registrants.map((r) =>
        notificationService.safeCreateFromTemplateOrFallback({
          templateKey: "session_reminder_30min",
          fallbackTitle: "Your session starts in 30 minutes",
          fallbackBody: `"${session.title}" starts at ${startTimeLabel} — join in time.`,
          recipient: r.user.toString(),
          variables: { sessionTitle: session.title, startTime: startTimeLabel },
          relatedEntityType: "SessionSchedule",
          relatedEntityId: session._id.toString(),
          actionUrl: session.meetingUrl || `/invictus/session-schedules/${session._id}`,

          dedupeKey: `session-reminder-${session._id}-${r.user.toString()}`,
        }),
      ),
    );
  }
};

export const startSessionReminderCron = (): void => {
  // প্রতি মিনিটে run
  cron.schedule("* * * * *", () => {
    runSessionReminderSweep().catch((err) =>
      console.error("Session reminder cron failed:", err),
    );
  });

  console.log("✅ Session reminder cron scheduled (every 1 min, 30-min window)");
};