const axios = require('axios');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const surahs = require('../components/surahs');

const API_URL = 'https://raw.githubusercontent.com/fardanahmed/recite-ml/refs/heads/master/data/data-uthmani.json';

const dashboard = () => {
  try {
    const surahData = {};

    for (let surah = 78; surah <= 114; surah += 1) {
      const surahKey = surah.toString();
      if (surahs[surahKey]) {
        surahData[surahKey] = {
          latin: surahs[surahKey].latin,
          english: surahs[surahKey].english,
          ayah: surahs[surahKey].ayah,
          arabic: surahs[surahKey].arabic,
        };
      }
    }

    if (Object.keys(surahData).length === 0) {
      throw new ApiError(httpStatus.NOT_FOUND, 'No surah data found');
    }

    return surahData;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error processing surah data');
  }
};


const getSurahById = async (surahId) => {
  try {
    // Get basic surah info from local data
    const localSurah = surahs[surahId];
    if (!localSurah) {
      throw new ApiError(httpStatus.NOT_FOUND, `Surah with ID ${surahId} not found`);
    }

    // Get detailed surah info from API
    const response = await axios.get(API_URL);
    const { data } = response;

    if (!data || !data.quran || !data.quran.surahs) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Invalid data format received from API');
    }

    // Find the surah in the API data - compare with string since API returns string numbers
    const apiSurah = data.quran.surahs.find((s) => s.num === surahId.toString());
    if (!apiSurah) {
      throw new ApiError(httpStatus.NOT_FOUND, `Surah with ID ${surahId} not found in API`);
    }

    // Map the ayahs from API data
    const ayahs = apiSurah.ayahs.map((ayah) => ({
      number: parseInt(ayah.num, 10),
      text: ayah.text,
    }));

    return {
      id: surahId.toString(),
      name: localSurah.arabic,
      nameTranslation: localSurah.english,
      numberOfAyahs: localSurah.ayah,
      revelationType: localSurah.location === 1 ? 'Meccan' : 'Medinan',
      ayahs,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.response) {
      throw new ApiError(httpStatus.BAD_GATEWAY, 'Error fetching data from external API');
    }
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error processing surah data');
  }
};

module.exports = {
  dashboard,
  getSurahById,
};
