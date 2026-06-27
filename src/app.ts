import express, { Application } from "express";
import cors from "cors";
import { NotFoundError, UnauthorizedError } from "./utility/errorResponses";
import globalErrorHandler from "./middleware/globalErrorHandler";
import routeNotFoundHandler from "./middleware/routeNotFoundHandler";
import router from "./routes";


const app : Application = express();


app.use(cors({
    origin : true,
    credentials : true
}));

app.use(express.json());    
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Changed Bro!");
})

app.use("/api/v1", router);

app.use(routeNotFoundHandler);
app.use(globalErrorHandler);

export default app;

