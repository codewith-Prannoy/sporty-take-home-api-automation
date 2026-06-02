require('dotenv').config({ quiet: true });

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  silent: 4
};

const configuredLevel = (process.env.LOG_LEVEL || 'info').toLowerCase();
const activeLevel = levels[configuredLevel] ?? levels.info;

/**
 * Checks if a log entry should be printed for the active log level.
 *
 * @param {'debug'|'info'|'warn'|'error'} level - Log level for the message.
 * @returns {boolean} True when the message should be emitted.
 */
const shouldLog = (level) => levels[level] >= activeLevel && activeLevel !== levels.silent;

/**
 * Formats optional structured payload data for console output.
 *
 * @param {*} payload - Optional log payload.
 * @returns {string} Empty string when no payload exists, otherwise a serialized payload.
 */
const formatPayload = (payload) => {
  if (payload === undefined) {
    return '';
  }

  if (typeof payload === 'string') {
    return ` ${payload}`;
  }

  return ` ${JSON.stringify(payload)}`;
};

/**
 * Writes a log message to the appropriate console stream.
 *
 * @param {'debug'|'info'|'warn'|'error'} level - Log level.
 * @param {string} message - Log message.
 * @param {*} [payload] - Optional structured details.
 * @returns {void}
 */
const log = (level, message, payload) => {
  if (!shouldLog(level)) {
    return;
  }

  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}${formatPayload(payload)}`;

  if (level === 'error') {
    console.error(line);
    return;
  }

  if (level === 'warn') {
    console.warn(line);
    return;
  }

  console.log(line);
};

module.exports = {
  /**
   * Logs diagnostic details intended for troubleshooting.
   *
   * @param {string} message - Log message.
   * @param {*} [payload] - Optional structured details.
   * @returns {void}
   */
  debug: (message, payload) => log('debug', message, payload),

  /**
   * Logs normal informational messages.
   *
   * @param {string} message - Log message.
   * @param {*} [payload] - Optional structured details.
   * @returns {void}
   */
  info: (message, payload) => log('info', message, payload),

  /**
   * Logs recoverable issues or retryable failures.
   *
   * @param {string} message - Log message.
   * @param {*} [payload] - Optional structured details.
   * @returns {void}
   */
  warn: (message, payload) => log('warn', message, payload),

  /**
   * Logs errors to stderr.
   *
   * @param {string} message - Log message.
   * @param {*} [payload] - Optional structured details.
   * @returns {void}
   */
  error: (message, payload) => log('error', message, payload)
};
