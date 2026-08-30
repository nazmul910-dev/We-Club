import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { initSocket } from "./socket/socket";
import http from "http";
import { dropLegacyQuizCertificateIndexes } from "./modules/quizCertificates/quiz.certificate.model.schema";

const port = process.env.PORT || 3000;

const main = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);

    // Drop any stale indexes left over from previous schema designs
    await dropLegacyQuizCertificateIndexes();

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server is running on port http://localhost:${port}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
};

main();
