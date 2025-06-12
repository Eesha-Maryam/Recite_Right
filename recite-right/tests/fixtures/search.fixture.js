const mongoose = require('mongoose');
const Surah = require('../../src/models/surah.model');

const searchResults = [
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Al-Fatiha',
    englishName: 'The Opening',
    englishNameTranslation: 'The Opening',
    numberOfAyahs: 7,
    revelationType: 'Meccan',
  },
  {
    _id: new mongoose.Types.ObjectId(),
    name: 'Al-Baqarah',
    englishName: 'The Cow',
    englishNameTranslation: 'The Cow',
    numberOfAyahs: 286,
    revelationType: 'Medinan',
  },
];

const insertSearchResults = async (results) => {
  await Surah.insertMany(results);
};

module.exports = {
  searchResults,
  insertSearchResults,
};
