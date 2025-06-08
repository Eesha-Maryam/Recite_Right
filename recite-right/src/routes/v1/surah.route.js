const express = require('express');
const { dashboardSurah, SurahById } = require('../../controllers/surah.controller');

const router = express.Router();

router.get('/dashboard', dashboardSurah);
router.get('/get-surah/:surahId', SurahById);

module.exports = router;

// const API_URL = 'https://raw.githubusercontent.com/fardanahmed/recite-ml/refs/heads/master/data/quran.json'; // Predefined API URL

// router.get('/get-surah', async (req, res) => {
//   try {
//     // Fetch data from the external API
//     const response = await axios.get(API_URL);
//     let { data } = response;
//     data = data['1'];
//     // console.log(data);
//     res.setHeader('Content-Type', 'text/html; charset=utf-8');
//     const allDisplayText = Object.values(data)
//       // .flatMap((surah) => Object.values(surah))
//       .map((ayah) => ayah.displayText)
//       .filter((text) => text)
//       // .reverse()
//       .join(' ');
//     // console.log(allDisplayText); // Log the displayText to the console
//     res.json({ allDisplayText });
//   } catch (error) {
//     res.status(500).json({
//       error: 'Failed to fetch data from the third-party API',
//       details: error.message,
//     });
//   }
// });
