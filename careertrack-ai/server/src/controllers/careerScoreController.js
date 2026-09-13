const { sendSuccess } = require('../utils/ApiResponse');
const asyncHandler = require('../utils/asyncHandler');
const careerScoreService = require('../services/careerScore.service');

const getScore = asyncHandler(async (req, res) => {
  const result = await careerScoreService.getCareerScore(req.user);
  sendSuccess(res, 200, 'CareerTrack Score computed', result);
});

module.exports = { getScore };
