const Activity = require('../models/Activity');

async function logActivity({ userId, jobApplicationId, type, description, metadata = {} }) {
  return Activity.create({
    user: userId,
    jobApplication: jobApplicationId,
    type,
    description,
    metadata,
  });
}

module.exports = { logActivity };
