import mongoose from "mongoose";
import app from "./app";
import config from "./config";


const port  = process.env.PORT || 3000;

const main = async () => {
    try {
        await mongoose.connect(config.MONGO_URI as string)
        app.listen(port, () => {
            console.log(`Server is running on port http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
}

main();