/**
 * Minimal structured logger. Swap for Winston/Pino in a real deployment;
 * kept dependency-free here so the project runs anywhere.
 * NEVER log passwords, tokens, or full user objects.
 */
const levels = ['error', 'warn', 'info', 'debug'];

function log(level, message, meta = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

module.exports = {
  error: (msg, meta) => log('error', msg, meta),
  warn: (msg, meta) => log('warn', msg, meta),
  info: (msg, meta) => log('info', msg, meta),
  debug: (msg, meta) => {
    if (process.env.NODE_ENV !== 'production') log('debug', msg, meta);
  },
  levels,
};
