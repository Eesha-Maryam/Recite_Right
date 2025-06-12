const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const surahRoute = require('./surah.route');
const config = require('../../config/config');
const userController = require('../../controllers/user.controller');
const auth = require('../../middlewares/auth');
const upload = require('../../middlewares/upload');

const router = express.Router();

// Public routes (no auth required)
router.use('/auth', authRoute);  // Auth routes don't need global auth middleware



// User profile routes (protected)
router.get('/me', userController.getMe);
router.patch('/me', userController.updateMe);
router.delete('/me', userController.deleteMe);
router.post('/me/avatar', upload.single('avatar'), userController.uploadAvatar);

// Other protected routes
router.use('/users',  auth(), userRoute);
router.use('/surah', surahRoute);

// Development-only routes
if (config.env === 'development') {
  router.use('/docs', docsRoute);
}

module.exports = router;





const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/surah',
    route: surahRoute,
  },
];

const devRoutes = [
  // routes available only in development mode
  {
    path: '/docs',
    route: docsRoute,
  },
];

defaultRoutes.forEach((route) => {
  router.use(route.path, route.route);
});

/* istanbul ignore next */
if (config.env === 'development') {
  devRoutes.forEach((route) => {
    router.use(route.path, route.route);
  });
}

module.exports = router;
