const feedbackService = require('../services/feedback.service');

const createFeedback = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User info missing' });
    }

    const { type, text, rating } = req.body;

    const feedback = await feedbackService.createFeedback({
      type,
      text,
      rating,
      user: req.user.id,
    });

    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// In feedback.controller.js
const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await feedbackService.getAllFeedbacks();
    res.status(200).json({ 
      success: true, 
      data: feedbacks.map(fb => ({
        ...fb,
        user: {
          ...fb.user,
          avatar: fb.user.avatar || `${req.protocol}://${req.get('host')}/default-avatar.png`
        }
      }))
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  createFeedback,
  getFeedbacks,
};
