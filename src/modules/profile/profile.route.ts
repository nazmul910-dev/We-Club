import { Router } from 'express';
import { verifyToken } from '../../middleware/authMiddleware';
import { upload } from '../../middleware/uploadMiddleware';
import { profileController } from './profile.controller';

const router = Router();

router.use(verifyToken);

router.get('/me', profileController.getMyProfile);

router.patch('/me/basic', profileController.updateBasicProfile);

router.patch('/me/bio', profileController.updateBio);

router.patch('/me/social-links', profileController.upsertSocialLink);

router.delete(
  '/me/social-links/:platform',
  profileController.deleteSocialLink
);

router.patch(
  '/me/marketing-channels',
  profileController.updateMarketingChannels
);

router.patch(
  '/me/image',
  upload.single('profileImage'),
  profileController.updateProfileImage
);

router.delete('/me/image', profileController.deleteProfileImage);

export const profileRoutes = router;