import express, { Application } from "express";
import cors from "cors";
import { NotFoundError, UnauthorizedError } from "./utility/errorResponses";
import globalErrorHandler from "./middleware/globalErrorHandler";
import routeNotFoundHandler from "./middleware/routeNotFoundHandler";
import router from "./routes";
import { paymentController } from "./modules/payment/payment.controller";


const app : Application = express();


app.use(cors({
    origin : true,
    credentials : true
}));

app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);

app.use(express.json());    
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send("Hello World Bro!");
})

app.use("/api/v1", router);

app.use(routeNotFoundHandler);
app.use(globalErrorHandler);

export default app;

