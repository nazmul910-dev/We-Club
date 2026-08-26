import express, { Application } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import globalErrorHandler from "./middleware/globalErrorHandler";
import routeNotFoundHandler from "./middleware/routeNotFoundHandler";
import router from "./routes";
import { paymentController } from "./modules/payment/payment.controller";
import { swaggerSpec } from "./swagger/swagger";
import { rateLimit } from 'express-rate-limit';
import  helmet  from "helmet";
import compression from "compression";



const app: Application = express();

app.set('trust proxy', 1);

const limiter = rateLimit({
 windowMs: 5 * 60 * 1000, // 5 minutes
 limit: 100, // Limit each IP to 100 requests per `window` (here, per 5 minutes)
 standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
 legacyHeaders: false, // Disable the `X-RateLimit-*` headers
 ipv6Subnet: 60, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
})


app.use(helmet({
  contentSecurityPolicy: false, 
}));

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(compression());




app.post(
  '/api/v1/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
);



app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", time: new Date().toISOString() });
});


app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(limiter)


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

