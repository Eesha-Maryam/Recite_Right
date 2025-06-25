const Feedback = require('../models/feedback.model');

const createFeedback = async ({ type, text, rating, user }) => {
  return await Feedback.create({ type, text, rating, user });
};

// In feedback.service.js
const getAllFeedbacks = async () => {
  const feedbacks = await Feedback.find()
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });

  return feedbacks.map(fb => ({
    ...fb.toObject(),
    user: {
      name: fb.user?.name || 'Anonymous',
      email: fb.user?.email || '',
      avatar: fb.user?.avatar || '/default-avatar.png' // Ensure default avatar
    }
  }));
};


module.exports = {
  createFeedback,
  getAllFeedbacks,
};
