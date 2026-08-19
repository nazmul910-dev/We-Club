import { ZodType } from "zod";

import { catchAsync } from "./catchAsync";

const validateRequest = (schema: ZodType) => {
  return catchAsync(async (req, res, next) => {
    await schema.parseAsync({
      body: req.body ?? {},
      params: req.params ?? {},
      query: req.query ?? {},
      cookies: req.cookies ?? {},
    });

    return next();
  });
};

export default validateRequest;