import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { initSocket } from "./socket/socket";
import http from "http";
import { dropLegacyQuizCertificateIndexes } from "./modules/quizCertificates/quiz.certificate.model.schema";
import { startSessionReminderCron } from "./modules/sessionSchedules/session.reminder.job";
import { ensurePrivateRooms } from "./modules/room/room.service";

const port = process.env.PORT || 3000;

const main = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);
    const systemUser = await mongoose.connection.collection("users").findOne({}, { projection: { _id: 1 } });
    if (systemUser?._id) await ensurePrivateRooms(String(systemUser._id));

    // Drop any stale indexes left over from previous schema designs
    await dropLegacyQuizCertificateIndexes();

    const httpServer = http.createServer(app);
    initSocket(httpServer);
    startSessionReminderCron()

    httpServer.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

main();
