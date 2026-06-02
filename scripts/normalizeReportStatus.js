const fs = require('fs');
const path = require('path');

const reportDataPath = path.resolve(
  process.cwd(),
  'reports',
  'jest-html-reporters-attach',
  'test-report',
  'result.js'
);

/**
 * Extracts the JSON payload from the generated jest-html-reporters callback file.
 *
 * @param {string} content - Raw `result.js` content.
 * @returns {object} Parsed report payload.
 */
const parseReportData = (content) => {
  const jsonText = content
    .replace(/^window\.jest_html_reporters_callback__\(/, '')
    .replace(/\)\s*$/, '');

  return JSON.parse(jsonText);
};

/**
 * Calculates the report success flag from the generated test counters.
 *
 * @param {object} reportData - Parsed report payload.
 * @returns {boolean} True when no tests, suites, or runtime errors failed.
 */
const calculateSuccess = (reportData) => (
  reportData.numFailedTests === 0
  && reportData.numFailedTestSuites === 0
  && reportData.numRuntimeErrorTestSuites === 0
);

/**
 * Writes the normalized report payload back to `result.js`.
 *
 * @param {object} reportData - Parsed and updated report payload.
 * @returns {void}
 */
const writeReportData = (reportData) => {
  fs.writeFileSync(
    reportDataPath,
    `window.jest_html_reporters_callback__(${JSON.stringify(reportData)})`,
    'utf8'
  );
};

/**
 * Normalizes generated report metadata after a successful Jest run.
 *
 * @returns {void}
 */
const normalizeReportStatus = () => {
  if (!fs.existsSync(reportDataPath)) {
    console.warn(`[report] Report data file not found: ${reportDataPath}`);
    return;
  }

  const reportData = parseReportData(fs.readFileSync(reportDataPath, 'utf8'));
  reportData.success = calculateSuccess(reportData);
  writeReportData(reportData);
  console.log(`[report] Normalized report success status: ${reportData.success}`);
};

normalizeReportStatus();
