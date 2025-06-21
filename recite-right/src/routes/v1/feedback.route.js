const express = require('express');
const router = express.Router();
const auth = require('../../middlewares/auth');
const feedbackController = require('../../controllers/feedback.controller');

router.route('/').post(auth(), feedbackController.createFeedback);
router.get('/', feedbackController.getFeedbacks);

module.exports = router;
