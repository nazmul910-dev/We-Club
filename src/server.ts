import mongoose from "mongoose";
import app from "./app";
import config from "./config";
import { initSocket } from "./socket/socket";
import http from "http";

const port = process.env.PORT || 3000;

const main = async () => {
  try {
    await mongoose.connect(config.MONGO_URI as string);

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
