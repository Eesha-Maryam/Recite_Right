// const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { dashboard, getSurahById } = require('../services/surah.service');

// const dashboardSurah = catchAsync(async (req, res) => {
//   const surah = await req.surahService.getSurahById(req.params.surahId);
//   if (!surah) {
//     return res.status(httpStatus.NOT_FOUND).json({ message: 'Surah not found' });
//   }
//   res.status(httpStatus.OK).json(surah);
// });

const dashboardSurah = catchAsync(async (req, res) => {
  const response = await dashboard();
  res.send({ response });
});

const SurahById = catchAsync(async (req, res) => {
  const { surahId } = req.params;
  const surah = await getSurahById(surahId);
  res.send({ surah });
});

module.exports = {
  dashboardSurah,
  SurahById,
};
