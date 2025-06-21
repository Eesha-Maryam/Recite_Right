const axios = require('axios');
const fs = require('fs');
const path = require('path');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const surahs = require('../components/surahs');

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

const getMutashabihat = () => {
    const baseDir = path.join(__dirname, '..', 'resources');
    const translationDir = path.join(baseDir, 'translation');
    const surahDir = path.join(baseDir, 'surah');

    const lines = fs.readFileSync(path.join(baseDir, '30.txt'), 'utf-8')
        .split('\n')
        .filter(line => line.trim());

    const padSurahNumber = (num) => num.toString().padStart(3, '0');

    const getVerse = (surah, ayah) => {
        const paddedSurah = padSurahNumber(surah);

        const surahPath = path.join(surahDir, `surah_${paddedSurah}.json`);
        const translationPath = path.join(translationDir, `t_surah_${paddedSurah}.json`);

        const surahData = JSON.parse(fs.readFileSync(surahPath, 'utf-8'));
        const translationData = JSON.parse(fs.readFileSync(translationPath, 'utf-8'));

        const verseKey = `verse_${ayah}`;
        const arabic = surahData.data[0].verse[verseKey] || '';
        const translation = translationData.data.find(v => v.surah == surah && v.aya == ayah)?.text || '';
        const surahName = surahData.data[0].name || '';

        return {
            surah: parseInt(surah),
            surahName,
            ayah: parseInt(ayah),
            arabic,
            translation
        };
    };

    const result = lines.map(line => {
        const [source, matches] = line.split('|');
        const [sourceSurah, sourceAyah] = source.split(':');

        const sourceObj = getVerse(sourceSurah, sourceAyah);

        const matchList = matches.split(',').map(match => {
            const [mSurah, mAyah] = match.split(':');
            return getVerse(mSurah, mAyah);
        });

        return {
            source: sourceObj,
            matches: matchList
        };
    });

    return result;
};

const getSurahById = async (surahId) => {
  try {
    const paddedId = String(surahId).padStart(3, '0');
    const filePath = path.join(__dirname, '../resources/surah', `surah_${paddedId}.json`);

    if (!fs.existsSync(filePath)) {
      throw new ApiError(httpStatus.NOT_FOUND, `Surah file surah_${paddedId}.json not found`);
    }

    const fileData = fs.readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(fileData);

    if (!parsedData.data || !Array.isArray(parsedData.data) || parsedData.data.length === 0) {
      throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Invalid surah file structure');
    }

    const surahObj = parsedData.data[0];

    const ayahs = Object.entries(surahObj.verse).map(([key, value]) => ({
      number: parseInt(key.replace('verse_', ''), 10),
      text: value,
    }));

    return {
      id: surahObj.index,
      name: surahObj.name,
      numberOfAyahs: ayahs.length - 1,
      ayahs,
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, 'Error processing surah data');
  }
};

module.exports = {
  dashboard,
  getMutashabihat,
  getSurahById,
};
