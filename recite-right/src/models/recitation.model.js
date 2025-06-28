const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const RecitationSessionSchema = mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    mistakeCount: {
      type: Number,
      required: true,
    },
    progressRate: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    surahRange: {
      start: {
        surah: Number,
        ayah: Number,
      },
      end: {
        surah: Number,
        ayah: Number,
      },
    },
    mistakes: [
      {
        word: String,
        surah: Number,
        ayah: Number,
        index: Number,
      },
    ],
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

RecitationSessionSchema.plugin(toJSON);

module.exports = mongoose.model('RecitationSession', RecitationSessionSchema);
