const express = require('express');
const dsaController = require('../controllers/dsaController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { logEntrySchema, updateGoalSchema } = require('../validators/dsa.validator');

const router = express.Router();

router.use(authenticate);
router.get('/summary', dsaController.getSummary);
router.put('/goal', validate(updateGoalSchema), dsaController.updateGoal);
router.post('/entries', validate(logEntrySchema), dsaController.logEntry);
router.get('/entries', dsaController.listEntries);
router.delete('/entries/:id', dsaController.deleteEntry);

module.exports = router;
