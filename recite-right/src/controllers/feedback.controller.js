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

const getFeedbacks = async (req, res) => {
  try {
    const feedbacks = await feedbackService.getAllFeedbacks();

    const feedbacksJson = feedbacks.map(fb => {
      return {
        id: fb._id.toString(),
        type: fb.type,
        text: fb.text,
        rating: fb.rating,
        createdAt: fb.createdAt,
        user: {
          name: fb.user.name || 'Anonymous',
          email: fb.user.email || '',
          avatar: fb.user.avatar,
        }
      };
    });

    res.status(200).json({ success: true, data: feedbacksJson });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};



module.exports = {
  createFeedback,
  getFeedbacks,
};
