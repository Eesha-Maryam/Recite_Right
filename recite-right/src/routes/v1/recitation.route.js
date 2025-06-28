const express = require('express');
const router = express.Router();
const recitationController = require('../../controllers/getSessions.controller');

router.get('/', recitationController.getSessions);

module.exports = router;
