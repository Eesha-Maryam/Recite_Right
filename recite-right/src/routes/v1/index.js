const express = require('express');
const authRoute = require('./auth.route');
const userRoute = require('./user.route');
const docsRoute = require('./docs.route');
const surahRoute = require('./surah.route');
const config = require('../../config/config');
const searchRoute = require('./search.route');
const quizRoute = require('./quiz.route');
const feedbackRoute = require('./feedback.route');
const router = express.Router();
const recitationRoute = require('./recitation.route');


const defaultRoutes = [
  {
    path: '/auth',
    route: authRoute,
  },
  {
    path: '/recitation',
    route: recitationRoute,
  },
  {
    path: '/users',
    route: userRoute,
  },
  {
    path: '/surah',
    route: surahRoute,
  },
  {
    path: '/search',
    route: searchRoute,
  },
  {
    path: '/quiz',
    route: quizRoute,
  },
  {
    path: '/feedback',
    route: feedbackRoute,
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
