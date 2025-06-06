const path = require('path');
const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const mongoSanitize = require('express-mongo-sanitize');
const compression = require('compression');
const cors = require('cors');
const passport = require('passport');
const httpStatus = require('http-status');
const config = require('./config/config');
const morgan = require('./config/morgan');
const { jwtStrategy } = require('./config/passport');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const feedbackRoutes = require('./routes/v1/feedback.route');


const app = express();

// Initialize logging
if (config.env !== 'test') {
  app.use(morgan.successHandler);
  app.use(morgan.errorHandler);
}

app.use('/feedback', feedbackRoutes);

// Security middleware
app.use(helmet());
app.use(xss());
app.use(mongoSanitize());
app.use(compression());

// Enable CORS
app.use(cors());
app.options('*', cors());

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT authentication
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// Rate limiting in production
if (config.env === 'production') {
  app.use('/v1/auth', authLimiter);
}

// API routes - organized by version
app.use('/v1', routes);             // Version 1 API routes
app.use('/api/v1', routes);         // Alternative version 1 API routes

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

// Handle 404 - Must be after all other routes
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// Error handling middleware
app.use(errorConverter);
app.use(errorHandler);

module.exports = app;