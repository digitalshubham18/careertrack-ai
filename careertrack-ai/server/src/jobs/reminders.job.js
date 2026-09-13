const JobApplication = require('../models/JobApplication');
const Notification = require('../models/Notification');
const { createNotification } = require('../services/notification.service');
const logger = require('../utils/logger');

const CHECK_INTERVAL_MS = 60 * 60 * 1000; // hourly

async function checkUpcomingEvents(io) {
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const applications = await JobApplication.find({
    $or: [
      { interviewDate: { $gte: now, $lte: in24h } },
      { deadline: { $gte: now, $lte: in24h } },
      { followUpDate: { $gte: now, $lte: in24h } },
    ],
  });

  for (const app of applications) {
    const checks = [
      {
        field: 'interviewDate',
        type: 'interview_reminder',
        title: 'Interview tomorrow',
        message: `Your interview for ${app.jobTitle} at ${app.companyName} is coming up soon.`,
      },
      {
        field: 'deadline',
        type: 'deadline_reminder',
        title: 'Application deadline approaching',
        message: `The application deadline for ${app.jobTitle} at ${app.companyName} is approaching.`,
      },
      {
        field: 'followUpDate',
        type: 'followup_reminder',
        title: 'Follow-up reminder',
        message: `It's time to follow up on your application to ${app.companyName}.`,
      },
    ];

    for (const check of checks) {
      const date = app[check.field];
      if (date && date >= now && date <= in24h) {
        const alreadySent = await Notification.findOne({
          user: app.user,
          relatedApplication: app._id,
          type: check.type,
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
        });
        if (!alreadySent) {
          await createNotification(io, {
            userId: app.user,
            type: check.type,
            title: check.title,
            message: check.message,
            relatedApplication: app._id,
          });
        }
      }
    }
  }
}

function startReminderJob(io) {
  // Run once at startup, then on an interval. Kept dependency-free
  // (no node-cron) to minimize moving parts; swap for node-cron/BullMQ
  // in a heavier production deployment.
  checkUpcomingEvents(io).catch((err) => logger.error('Reminder job failed', { error: err.message }));
  setInterval(() => {
    checkUpcomingEvents(io).catch((err) => logger.error('Reminder job failed', { error: err.message }));
  }, CHECK_INTERVAL_MS);
}

module.exports = { startReminderJob, checkUpcomingEvents };
