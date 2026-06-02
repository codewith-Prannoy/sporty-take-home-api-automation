const { addMsg } = require('jest-html-reporters/helper');

/**
 * Converts an assertion value into a report-friendly string.
 *
 * @param {*} value - Value captured from an expected or actual assertion result.
 * @returns {string} String representation used in the HTML report details table.
 */
const stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(', ');
  }

  if (value && typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
};

/**
 * Compares expected and actual values and returns a report status label.
 *
 * @param {*} expected - Expected assertion value.
 * @param {*} actual - Actual value returned by the API or validation helper.
 * @returns {string} `PASS` when values match exactly after JSON serialization, otherwise `FAIL`.
 */
const getStatus = (expected, actual) => (
  JSON.stringify(expected) === JSON.stringify(actual) ? 'PASS' : 'FAIL'
);

/**
 * Builds normalized report rows from raw assertion metadata.
 *
 * @param {Array<{ assertion: string, expected: *, actual: * }>} assertions - Assertion metadata from a test case.
 * @returns {Array<{ assertion: string, expected: string, actual: string, status: string }>} Rows ready for table rendering.
 */
const createAssertionRows = (assertions) => assertions.map((assertion) => ({
  assertion: assertion.assertion,
  expected: stringifyValue(assertion.expected),
  actual: stringifyValue(assertion.actual),
  status: getStatus(assertion.expected, assertion.actual)
}));

/**
 * Builds a compact failure message for report rows that do not match.
 *
 * @param {Array<{ assertion: string, expected: string, actual: string, status: string }>} rows - Report rows.
 * @returns {string} Failure details used to fail the current Jest test.
 */
const createMismatchMessage = (rows) => rows
  .filter((row) => row.status === 'FAIL')
  .map((row) => `${row.assertion}: expected ${row.expected}, actual ${row.actual}`)
  .join('\n');

/**
 * Formats assertion rows as a Markdown-style table for `jest-html-reporters`.
 *
 * @param {Array<{ assertion: string, expected: string, actual: string, status: string }>} rows - Report rows.
 * @returns {string} Markdown-style table shown under the test row's Info action.
 */
const toMarkdownTable = (rows) => {
  const header = '| Assertion | Expected | Actual | Status |';
  const separator = '| --- | --- | --- | --- |';
  const body = rows.map((row) => (
    `| ${row.assertion} | ${row.expected} | ${row.actual} | ${row.status} |`
  ));

  return [header, separator, ...body].join('\n');
};

/**
 * Attaches assertion-level details to the current Jest test in the HTML report.
 *
 * @param {object} params - Report payload.
 * @param {string} params.title - Section title shown in the test's expanded Info view.
 * @param {Array<{ assertion: string, expected: *, actual: * }>} params.assertions - Assertion rows to display.
 * @param {boolean} [params.failOnMismatch=true] - Fails the Jest test when any report row mismatches.
 * @returns {Promise<void>} Resolves after the report message is written and checked.
 */
const addAssertionReport = async ({ title, assertions, failOnMismatch = true }) => {
  const rows = createAssertionRows(assertions);

  await addMsg({
    message: [
      title,
      '',
      toMarkdownTable(rows)
    ].join('\n')
  });

  const mismatchMessage = createMismatchMessage(rows);

  if (failOnMismatch && mismatchMessage) {
    throw new Error(`Assertion report mismatch:\n${mismatchMessage}`);
  }
};

module.exports = {
  addAssertionReport
};
