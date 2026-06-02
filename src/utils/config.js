require('dotenv').config({ quiet: true });

/**
 * Converts environment string values to booleans.
 *
 * @param {*} value - Raw environment value.
 * @returns {boolean} True only when the value is the string `true`, case-insensitive.
 */
const toBoolean = (value) => String(value).toLowerCase() === 'true';

/**
 * Reads an environment variable as a positive integer.
 *
 * @param {string} name - Environment variable name.
 * @param {number} defaultValue - Value used when the variable is not set.
 * @returns {number} Parsed positive integer.
 * @throws {Error} When the provided value is not a positive integer.
 */
const readPositiveInteger = (name, defaultValue) => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
    throw new Error(`${name} must be a positive integer. Received: ${rawValue}`);
  }

  return parsedValue;
};

/**
 * Reads an environment variable as a non-negative integer.
 *
 * @param {string} name - Environment variable name.
 * @param {number} defaultValue - Value used when the variable is not set.
 * @returns {number} Parsed non-negative integer.
 * @throws {Error} When the provided value is not a non-negative integer.
 */
const readNonNegativeInteger = (name, defaultValue) => {
  const rawValue = process.env[name];

  if (rawValue === undefined || rawValue === '') {
    return defaultValue;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isInteger(parsedValue) || parsedValue < 0) {
    throw new Error(`${name} must be a non-negative integer. Received: ${rawValue}`);
  }

  return parsedValue;
};

/**
 * Reads and validates the configured API base URL.
 *
 * @param {string} defaultValue - Default URL used when `API_BASE_URL` is not set.
 * @returns {string} Valid base URL.
 * @throws {Error} When the URL is invalid.
 */
const readBaseUrl = (defaultValue) => {
  const rawValue = process.env.API_BASE_URL || defaultValue;

  try {
    return new URL(rawValue).toString().replace(/\/$/, '');
  } catch (error) {
    throw new Error(`API_BASE_URL must be a valid URL. Received: ${rawValue}`);
  }
};

/**
 * Reads and validates the configured log level.
 *
 * @param {string} defaultValue - Default log level.
 * @returns {string} Valid log level.
 * @throws {Error} When the log level is unsupported.
 */
const readLogLevel = (defaultValue) => {
  const allowedLevels = ['debug', 'info', 'warn', 'error', 'silent'];
  const rawValue = (process.env.LOG_LEVEL || defaultValue).toLowerCase();

  if (!allowedLevels.includes(rawValue)) {
    throw new Error(`LOG_LEVEL must be one of ${allowedLevels.join(', ')}. Received: ${rawValue}`);
  }

  return rawValue;
};

/**
 * Runtime configuration loaded from `.env` with safe defaults for local runs.
 *
 * @type {{
 *   baseUrl: string,
 *   requestTimeoutMs: number,
 *   retryCount: number,
 *   logLevel: string,
 *   logApiRequests: boolean
 * }}
 */
const config = {
  baseUrl: readBaseUrl('https://pokeapi.co/api/v2'),
  requestTimeoutMs: readPositiveInteger('API_TIMEOUT_MS', 15000),
  retryCount: readNonNegativeInteger('API_RETRY_COUNT', 2),
  logLevel: readLogLevel('info'),
  logApiRequests: toBoolean(process.env.LOG_API_REQUESTS || false)
};

module.exports = config;
