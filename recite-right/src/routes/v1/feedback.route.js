const express = require('express');
const router = express.Router();
const feedbackController = require('../../controllers/feedback.controller');
// Remove authMiddleware for now if you're debugging
// const authMiddleware = require('../middlewares/auth.middleware');

router.post('/', feedbackController.submitFeedback);
router.get('/', feedbackController.getAllFeedback);

module.exports = router;
