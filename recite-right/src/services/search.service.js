/* eslint-disable prettier/prettier */
const { Surah } = require('../models');

const searchService = async (query) => {
  const searchQuery = query
    ? {
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { englishName: { $regex: query, $options: 'i' } },
        { englishNameTranslation: { $regex: query, $options: 'i' } },
      ],
    }
    : {};

  const surahs = await Surah.find(searchQuery).sort({ numberOfAyahs: 1 });
  return surahs;
};

module.exports = {
  searchService,
};
