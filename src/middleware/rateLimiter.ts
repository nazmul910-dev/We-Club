import { rateLimit } from "express-rate-limit";

// Strict limiter for auth endpoints — this is your actual brute-force defense.
// Keep this tight; legitimate users rarely hit login/register more than a
// handful of times in 15 minutes, attackers do.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts, please try again later.",
});

// Moderate limiter for payment-initiating endpoints (checkout/session creation).
// Not brute-force protection — just guards against retry storms / accidental
// client-side loops hammering Stripe session creation.
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests, please try again later.",
});