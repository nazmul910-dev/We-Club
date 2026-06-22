import { Router } from 'express';

import { userRoutes } from '../modules/users/userRoute';
// import { userRoutes } from '../modules/user/user.route';
// import { adminRoutes } from '../modules/admin/admin.route';
// import { courseRoutes } from '../modules/course/course.route';

const router = Router();

type TModuleRoute = {
  path: string;
  route: Router;
};

const moduleRoutes: TModuleRoute[] = [
    {
        path: '/users',
        route : userRoutes
    }, 
    // {
    // another route loading here
    // }

];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

export default router;