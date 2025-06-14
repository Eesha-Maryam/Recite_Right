const axios = require('axios');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const surahs = require('../components/surahs'); // Import the surah.json file

// const dashboardAPI = 'https://raw.githubusercontent.com/fardanahmed/recite-ml/refs/heads/master/data/data-uthmani.json'; // Predefined API URL

const dashboard = () => {
  const surahData = {};
  // console.log('Surahs:', surahs['default']['1']);

  for (let surah = 78; surah <= 114; surah += 1) {
    const surahKey = surah.toString();
    if (surahs[surahKey]) {
      surahData[surahKey] = {
        latin: surahs[surahKey].latin,
        english: surahs[surahKey].english,
      };
    }
  }

  if (Object.keys(surahData).length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Error fetching Surah data');
  }
  return surahData;
};

const API_URL = 'https://raw.githubusercontent.com/fardanahmed/recite-ml/refs/heads/master/data/data-uthmani.json';

const getSurahById = async (surahId) => {
  try {
    const response = await axios.get(API_URL);
    const { data } = response;
    const surah = data.quran.surahs.find((s) => s.num === surahId);
    if (!surah) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Surah not found');
    }
    return surah;
  } catch (error) {
    throw new Error('Error fetching Surah data');
  }
};

module.exports = {
  dashboard,
  getSurahById,
};
