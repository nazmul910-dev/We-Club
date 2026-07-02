import express, { Application } from "express";
import cors from "cors";
import { NotFoundError, UnauthorizedError } from "./utility/errorResponses";
import swaggerUi from "swagger-ui-express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import routeNotFoundHandler from "./middleware/routeNotFoundHandler";
import router from "./routes";
import { paymentController } from "./modules/payment/payment.controller";
import { swaggerSpec } from "./swagger/swagger";

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

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "We-Club API Docs",
  })
);

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});


app.use("/api/v1", router);

app.use(routeNotFoundHandler);
app.use(globalErrorHandler);

export default app;

