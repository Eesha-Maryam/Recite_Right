const jwt = require('jsonwebtoken');
const config = require('../config/config');
const { tokenTypes } = require('../config/tokens');
const User = require('../models/user.model');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');



const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Authentication failed'));
  }
  if (info) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, info.message || 'Invalid token'));
  }
  if (!user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }
  req.user = user;

  if (requiredRights.length) {
    const userRights = roleRights.get(user.role);
    if (!userRights) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Invalid user role'));
    }
    const hasRequiredRights = requiredRights.every((requiredRight) => userRights.includes(requiredRight));
    if (!hasRequiredRights && req.params.userId !== user.id) {
      return reject(new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions'));
    }
  }

  resolve();
};

const auth = () => {
  return async (req, res, next) => {
    try {
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
      }

     const payload = jwt.verify(token, config.jwt.secret);

if (payload.type !== tokenTypes.ACCESS) {
  throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
}


      if (payload.type !== tokenTypes.ACCESS) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid token type');
      }

    const user = await User.findById(payload.sub);
if (!user) {
  throw new ApiError(httpStatus.UNAUTHORIZED, 'User not found');
}


      req.user = user;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = auth;
