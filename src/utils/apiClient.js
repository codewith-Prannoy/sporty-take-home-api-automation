const logger = require('./logger');

/**
 * Lightweight HTTP client used by the API tests.
 *
 * Handles base URL joining, request timeout, retry-on-network-error behavior,
 * JSON response parsing, and optional request/response logging.
 */
class ApiClient {
  /**
   * Creates an API client instance.
   *
   * @param {object} options - Client configuration.
   * @param {string} options.baseUrl - Base API URL, for example `https://pokeapi.co/api/v2`.
   * @param {number} [options.timeoutMs=15000] - Request timeout in milliseconds.
   * @param {number} [options.retryCount=0] - Number of retry attempts for retryable network errors.
   * @param {boolean} [options.logRequests=false] - Enables request/response metadata logging.
   */
  constructor({ baseUrl, timeoutMs = 15000, retryCount = 0, logRequests = false }) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.timeoutMs = timeoutMs;
    this.retryCount = retryCount;
    this.logRequests = logRequests;
  }

  /**
   * Sends a GET request to the provided API path.
   *
   * @param {string} path - Relative path, for example `/pokemon/25`.
   * @returns {Promise<{ status: number, ok: boolean, headers: Headers, data: * }>} Parsed response wrapper.
   */
  async get(path) {
    return this.request('GET', path);
  }

  /**
   * Sends an HTTP request with retry handling.
   *
   * Retries are applied only to thrown network/timeout errors. Valid HTTP
   * responses such as 404 are returned to the test for assertion.
   *
   * @param {string} method - HTTP method.
   * @param {string} path - Relative request path.
   * @returns {Promise<{ status: number, ok: boolean, headers: Headers, data: * }>} Parsed response wrapper.
   */
  async request(method, path) {
    const url = `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
    let lastError;

    for (let attempt = 0; attempt <= this.retryCount; attempt += 1) {
      try {
        this.logRequest({ method, url, attempt });
        return await this.fetchWithTimeout(url, { method });
      } catch (error) {
        lastError = error;
        logger.warn('API request failed', {
          method,
          url,
          attempt: attempt + 1,
          error: error.message
        });

        if (!this.shouldRetry(error, attempt)) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  /**
   * Executes `fetch` with an abort-based timeout and parses the response body.
   *
   * @param {string} url - Fully qualified request URL.
   * @param {object} options - Fetch options.
   * @param {string} options.method - HTTP method.
   * @param {object} [options.headers] - Optional request headers.
   * @returns {Promise<{ status: number, ok: boolean, headers: Headers, data: * }>} Parsed response wrapper.
   */
  async fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          Accept: 'application/json',
          ...(options.headers || {})
        },
        signal: controller.signal
      });

      const contentType = response.headers.get('content-type') || '';
      const body = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

      this.logResponse({
        method: options.method,
        url,
        status: response.status,
        ok: response.ok
      });

      return {
        status: response.status,
        ok: response.ok,
        headers: response.headers,
        data: body
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Determines whether a failed request should be retried.
   *
   * @param {Error} error - Error thrown by fetch or timeout handling.
   * @param {number} attempt - Zero-based attempt index.
   * @returns {boolean} True when another retry should be attempted.
   */
  shouldRetry(error, attempt) {
    return attempt < this.retryCount && error.name !== 'AbortError';
  }

  /**
   * Logs request metadata when API request logging is enabled.
   *
   * @param {object} params - Request metadata.
   * @param {string} params.method - HTTP method.
   * @param {string} params.url - Fully qualified request URL.
   * @param {number} params.attempt - Zero-based attempt index.
   * @returns {void}
   */
  logRequest({ method, url, attempt }) {
    if (!this.logRequests) {
      return;
    }

    logger.debug('API request started', {
      method,
      url,
      attempt: attempt + 1
    });
  }

  /**
   * Logs response metadata when API request logging is enabled.
   *
   * @param {object} params - Response metadata.
   * @param {string} params.method - HTTP method.
   * @param {string} params.url - Fully qualified request URL.
   * @param {number} params.status - HTTP status code.
   * @param {boolean} params.ok - Fetch success flag.
   * @returns {void}
   */
  logResponse({ method, url, status, ok }) {
    if (!this.logRequests) {
      return;
    }

    logger.debug('API response received', {
      method,
      url,
      status,
      ok
    });
  }
}

module.exports = ApiClient;
