const RecitationSession = require('../models/recitation.model');

const getAllSessions = async () => {
  return RecitationSession.find({}).sort({ sessionDate: -1 }).lean();
};

module.exports = {
  getAllSessions,
};
