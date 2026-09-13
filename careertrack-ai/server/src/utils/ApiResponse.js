/**
 * Standard success envelope used by every controller:
 * { success: true, message, data }
 */
function sendSuccess(res, statusCode, message, data = {}) {
  return res.status(statusCode).json({ success: true, message, data });
}

module.exports = { sendSuccess };
