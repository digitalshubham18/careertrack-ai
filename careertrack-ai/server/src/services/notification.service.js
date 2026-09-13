const Notification = require('../models/Notification');

/**
 * Creates a persistent notification and emits it in real time over
 * Socket.IO to the user's private room (see jobs/socket.js).
 */
async function createNotification(io, { userId, type, title, message, relatedApplication = null, relatedJobListing = null }) {
  const notification = await Notification.create({
    user: userId,
    type,
    title,
    message,
    relatedApplication,
    relatedJobListing,
  });

  if (io) {
    io.to(`user:${userId}`).emit('notification:new', notification);
  }

  return notification;
}

module.exports = { createNotification };
