const http = require('http');
const { Server } = require('socket.io');

const env = require('./config/env');
const connectDB = require('./config/db');
const createApp = require('./app');
const initSocket = require('./jobs/socket');
const { startReminderJob } = require('./jobs/reminders.job');
const { startJobSync } = require('./jobs/jobSync.job');
const logger = require('./utils/logger');

async function start() {
  await connectDB();

  const httpServer = http.createServer();
  const io = new Server(httpServer, {
    cors: {
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (origin === env.clientUrl) return callback(null, true);
        if (env.nodeEnv !== 'production' && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`CORS: origin ${origin} is not allowed`));
      },
      credentials: true,
    },
  });
  initSocket(io);

  const app = createApp(io);
  httpServer.on('request', app);

  httpServer.listen(env.port, () => {
    logger.info(`CareerTrack AI API listening on port ${env.port} [${env.nodeEnv}]`);
  });

  startReminderJob(io);
  startJobSync(io);

  process.on('unhandledRejection', (err) => {
    logger.error('Unhandled promise rejection', { error: err.message, stack: err.stack });
  });
}

start();
