const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const { User } = require('../models');

const createUser = catchAsync(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(httpStatus.CREATED).send(user);
});

const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  const result = await userService.queryUsers(filter, options);
  res.send(result);
});

const getUser = catchAsync(async (req, res) => {
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  res.send(user);
});

const updateUser = catchAsync(async (req, res) => {
  const user = await userService.updateUserById(req.params.userId, req.body);
  res.send(user);
});

const deleteUser = catchAsync(async (req, res) => {
  await userService.deleteUserById(req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});


// user.controller.js
const getMe = async (req, res) => {
  if (!req.user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).send(req.user); // Send full user
};




const updateMe = catchAsync(async (req, res) => {
  // Only allow certain fields to be updated
  const updateBody = pick(req.body, ['name', 'email']);
  
  // Update user
  const updatedUser = await userService.updateUserById(req.user._id, updateBody);
  
  res.send({
    id: updatedUser._id,
    name: updatedUser.name,
    email: updatedUser.email,
    avatar: updatedUser.avatar,
    role: updatedUser.role,
    streak: updatedUser.streak || 0,
    createdAt: updatedUser.createdAt
  });
});



const uploadAvatar = async (req, res) => {
  if (!req.file) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'No file uploaded');
  }

  const avatarUrl = `${req.protocol}://${req.get('host')}/uploads/avatars/${req.file.filename}`;


  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  ).select('-password');

  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  res.status(httpStatus.OK).send({
    avatar: avatarUrl,
    message: 'Avatar uploaded successfully'
  });
};

const updateAvatar = async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ message: 'No file uploaded' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  const user = await User.findByIdAndUpdate(req.user.id, { avatar: imageUrl }, { new: true });
  res.send({ avatar: user.avatar });
};



const deleteMe = async (req, res) => {
  await User.findByIdAndDelete(req.user.id);
  res.status(204).send();
};



module.exports = {
  createUser,
  getUsers,
  getUser,
  getMe, // ← Add this line
  updateUser,
  deleteUser,
  updateMe,
  uploadAvatar,
  deleteMe,
  updateAvatar,
};

