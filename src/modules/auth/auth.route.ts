import { Router } from 'express';
import { authController } from './auth.controller';
import validateRequest from '../../utility/validateRequest';
import { AuthValidations } from './auth.validation';
import { verifyToken } from '../../middleware/authMiddleware';


const router = Router();

router.post("/login", authController.loginUserInDB);
router.post("/signup", authController.createUserInDB );
router.post("/change-password", verifyToken,validateRequest(AuthValidations.changePasswordValidationSchema), authController.changePassword );
router.post("/forget-password", validateRequest(AuthValidations.forgetPasswordValidationSchema), authController.forgetPassword );

router.post("/reset-password", validateRequest(AuthValidations.resetPasswordValidationSchema), authController.resetPassword );

router.post("/refresh-token", validateRequest(AuthValidations.refreshTokenValidationSchema), authController.refreshtoken );



export const authRoutes = router;