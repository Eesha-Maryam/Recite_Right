
const validator = require('validator');
const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const config = require('../config/config');
const ApiError = require('../utils/ApiError');
const User = require('../models/user.model');
const { tokenTypes } = require('../config/tokens');

const { authService, userService, tokenService, emailService } = require('../services');

const verifyEmailByGet = catchAsync(async (req, res) => {
  const { token } = req.params;

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.sub);
    
    if (!user) {
      return res.redirect(`${config.clientUrl}/email-verification-failed?reason=user-not-found`);
    }

    if (user.isEmailVerified) {
      return res.redirect(`${config.clientUrl}/email-verification-failed?reason=already-verified`);
    }

    user.isEmailVerified = true;
    await user.save();

    return res.redirect(`${config.clientUrl}/email-verified-success`);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.redirect(`${config.clientUrl}/email-verification-failed?reason=expired`);
    }
    return res.redirect(`${config.clientUrl}/email-verification-failed?reason=invalid`);
  }
});





// Configure Gmail transporter ONCE
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'reciteright12@gmail.com',
    pass: 'ncmpwyuejymvibud'  // App password
  }
});


// ... rest of your imports ...

const register = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;
  const normalizedEmail = email.trim().toLowerCase();

  // Check if email exists
  if (await User.findOne({ email: normalizedEmail })) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  // Create user (unverified)
  const user = await User.create({
    name,
    email: normalizedEmail,
    password,
    isEmailVerified: false
  });

  // Generate verification token
  const token = jwt.sign(
    { sub: user.id },
    config.jwt.secret,
    { expiresIn: config.jwt.verifyEmailExpirationMinutes * 60 }
  );

  // Send verification email
  try {
    const emailSent = await emailService.sendVerificationEmail(normalizedEmail, token);
    if (!emailSent) {
      await User.findByIdAndDelete(user.id);
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
    }
  } catch (error) {
    await User.findByIdAndDelete(user.id);
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to send verification email');
  }

  res.status(httpStatus.CREATED).send({
    message: `Verification email sent to ${normalizedEmail}. Please check your inbox.`,
    user: user.toJSON()
  });
});

// auth.controller.js

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.trim().toLowerCase();
  
  const user = await userService.getUserByEmail(normalizedEmail);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  if (!user.isEmailVerified) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please verify your email before logging in.');
  }

  const isPasswordMatch = await user.isPasswordMatch(password);
  if (!isPasswordMatch) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }

  const tokens = await tokenService.generateAuthTokens(user);
  
  res.send({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      streak: user.streak || 0,
      createdAt: user.createdAt
    },
    tokens: {
      access: {
        token: tokens.access.token,
        expires: tokens.access.expires
      },
      refresh: {
        token: tokens.refresh.token,
        expires: tokens.refresh.expires
      }
    }
  });
});


const logout = catchAsync(async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(httpStatus.NO_CONTENT).send();
});

const refreshTokens = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  
  // Verify refresh token
  const refreshTokenDoc = await tokenService.verifyToken(refreshToken, tokenTypes.REFRESH);
  
  // Check if user still exists
  const user = await userService.getUserById(refreshTokenDoc.user);
  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
  }

  // Delete the old refresh token
  await refreshTokenDoc.remove();

  // Generate new tokens
  const tokens = await tokenService.generateAuthTokens(user);
  
  res.send({
    access: {
      token: tokens.access.token,
      expires: tokens.access.expires
    },
    refresh: {
      token: tokens.refresh.token,
      expires: tokens.refresh.expires
    }
  });
});



const forgotPassword = catchAsync(async (req, res) => {
  
  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email);
  await emailService.sendResetPasswordEmail(req.body.email, resetPasswordToken);
  res.status(httpStatus.NO_CONTENT).send();
});

// auth.service.js



// Then modify ONLY the resetPassword function:
const resetPassword = catchAsync(async (req, res) => {
  const { token } = req.query;
  const { password } = req.body;

  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Reset token is required');
  }

  try {
    // Changed this line only - added tokenTypes.RESET_PASSWORD
    const resetPasswordTokenDoc = await tokenService.verifyToken(token, 'resetPassword'); // or tokenTypes.RESET_PASSWORD
    
    const user = await userService.getUserById(resetPasswordTokenDoc.user);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    await userService.updateUserById(user.id, { password });
    res.status(httpStatus.NO_CONTENT).send();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Password reset link has expired');
    }
    throw error;
  }
});

const sendVerificationEmail = catchAsync(async (req, res) => {
  const verifyEmailToken = await tokenService.generateVerifyEmailToken(req.user);
  await emailService.sendVerificationEmail(req.user.email, verifyEmailToken);
  res.status(httpStatus.NO_CONTENT).send();
});

// Example: auth.controller.js
// auth.controller.js
const verifyEmail = catchAsync(async (req, res) => {
  const { token } = req.query;

  try {
    const payload = jwt.verify(token, config.jwt.secret);
    const user = await User.findById(payload.sub);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email already verified' });
    }

    user.isEmailVerified = true;
    await user.save();

    return res.status(200).json({ message: 'Email verified successfully' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Verification link has expired' });
    }
    return res.status(400).json({ message: 'Invalid verification token' });
  }
});



// Add this to your auth.controller.js
const verifyResetToken = catchAsync(async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token is required');
  }

  try {
    // This will throw if token is invalid or expired
    await tokenService.verifyToken(token, tokenTypes.RESET_PASSWORD);
    res.status(httpStatus.OK).send({ valid: true });
  } catch (error) {
    res.status(httpStatus.BAD_REQUEST).send({ 
      valid: false, 
      message: error.message 
    });
  }
});



module.exports = {
  register,
  verifyEmailByGet,
  verifyResetToken,
  login,
  logout,
  refreshTokens,
  forgotPassword,
  resetPassword,
  sendVerificationEmail,
  verifyEmail,
};