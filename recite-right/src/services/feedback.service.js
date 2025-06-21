const Feedback = require('../models/feedback.model');

const createFeedback = async ({ type, text, rating, user }) => {
  return await Feedback.create({ type, text, rating, user });
};

const getAllFeedbacks = async () => {
  const feedbacks = await Feedback.find()
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 });

  if (!feedbacks) {
    throw new Error('No feedbacks found');
  }

  if (!Array.isArray(feedbacks)) {
    throw new Error('Feedbacks is not an array');
  }

  // Defensive: ensure user exists on each feedback (in case populate fails)
  feedbacks.forEach(fb => {
    if (!fb.user) {
      // Assign a default user object to prevent errors on frontend
      fb.user = { name: 'Anonymous', email: '' };
    }
  });

  return feedbacks;
};


module.exports = {
  createFeedback,
  getAllFeedbacks,
};
