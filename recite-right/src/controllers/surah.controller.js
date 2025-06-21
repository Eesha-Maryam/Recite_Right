// const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiResponse = require('../utils/response');
const { dashboard, getSurahById, getMutashabihat } = require('../services/surah.service');

// const dashboardSurah = catchAsync(async (req, res) => {
//   const surah = await req.surahService.getSurahById(req.params.surahId);
//   if (!surah) {
//     return res.status(httpStatus.NOT_FOUND).json({ message: 'Surah not found' });
//   }
//   res.status(httpStatus.OK).json(surah);
// });

const dashboardSurah = catchAsync(async (req, res) => {
  const response = await dashboard();
  return ApiResponse.success(res, response, 'Surahs retrieved successfully');
});

const mutashabihat = catchAsync(async (req, res) => {
  const response = await getMutashabihat();
  return ApiResponse.success(res, response, 'Mutashabihat retrieved successfully');
});

const SurahById = catchAsync(async (req, res) => {
  const { surahId } = req.params;
  const surah = await getSurahById(surahId);
  return ApiResponse.success(res, surah, 'Surah retrieved successfully');
});

module.exports = {
  dashboardSurah,
  mutashabihat,
  SurahById,
};
