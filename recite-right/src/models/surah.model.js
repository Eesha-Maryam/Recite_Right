const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const surahSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    englishName: {
      type: String,
      required: true,
      trim: true,
    },
    englishNameTranslation: {
      type: String,
      required: true,
      trim: true,
    },
    numberOfAyahs: {
      type: Number,
      required: true,
      min: 1,
    },
    revelationType: {
      type: String,
      required: true,
      enum: ['Meccan', 'Medinan'],
    },
  },
  {
    timestamps: true,
  },
);

surahSchema.plugin(toJSON);
surahSchema.plugin(paginate);

const Surah = mongoose.model('Surah', surahSchema);

module.exports = Surah;
