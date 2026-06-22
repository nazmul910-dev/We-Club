import { Router } from 'express';
import { authController } from './auth.controller';

const router = Router();

router.post("/login", authController.loginUserInDB);
router.post("/signup", authController.createUserInDB );


export const authRoutes = router;