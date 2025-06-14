const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: { type: String, required: true },
  text: { type: String, required: true },
  rating: { type: Number, default: 0 },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Link to user
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
