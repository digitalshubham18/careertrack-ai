const express = require('express');
const careerScoreController = require('../controllers/careerScoreController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);
router.get('/', careerScoreController.getScore);

module.exports = router;
