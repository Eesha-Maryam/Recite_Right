const Feedback = require('../models/feedback.model');

exports.submitFeedback = async (req, res) => {
  try {
    const { type, text, rating } = req.body;

    const feedback = new Feedback({
      type,
      text,
      rating,
     // populated from auth middleware
    });

    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error while submitting feedback' });
  }
};

exports.getAllFeedback = async (req, res) => {
  try {
    const feedbacks = await Feedback.find()
      .sort({ createdAt: -1 })
      .populate('user', 'name avatar'); // pull user info

    res.json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching feedback' });
  }
};
