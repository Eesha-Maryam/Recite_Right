const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const recitationService = require('../services/recitation.service');

const getSessions = catchAsync(async (req, res) => {
  const sessions = await recitationService.getAllSessions();
  res.status(httpStatus.OK).send(sessions);
});

module.exports = {
  getSessions,
};
