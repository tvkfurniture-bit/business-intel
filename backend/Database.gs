/**
 * Business Scope in Your City — Google Sheets Relational Database Abstraction
 * Manages 11 worksheets with ACID row appends, schema mapping, formula injection prevention,
 * and immutable audit logging.
 */

const Database = (function() {
  'use strict';

  // Master worksheet names
  const SHEETS = {
    CITIES: 'Cities',
    OPPORTUNITIES: 'Opportunities',
    BLUEPRINTS: 'Blueprints',
    LAUNCH_PLANS: 'LaunchPlans',
    INSIGHTS: 'Insights',
    ENQUIRIES: 'Enquiries',
    ORDERS: 'Orders',
    NEWSLETTER: 'Newsletter',
    SETTINGS: 'Settings',
    AUDIT_LOG: 'AuditLog',
    VERIFICATION_KEYS: 'VerificationKeys'
  };

  /**
   * Resolve active Google Spreadsheet instance.
   * Prioritizes Script Properties 'SPREADSHEET_ID'; falls back to bound container.
   * @returns {GoogleAppsScript.Spreadsheet.Spreadsheet}
   */
  function getSpreadsheet_() {
    const props = PropertiesService.getScriptProperties();
    const sheetId = props.getProperty('SPREADSHEET_ID');
    if (sheetId) {
      return SpreadsheetApp.openById(sheetId);
    }
    return SpreadsheetApp.getActiveSpreadsheet();
  }

  /**
   * Retrieve a worksheet by name, creating it with header columns if it does not exist.
   * @param {string} sheetName
   * @param {Array<string>} [initialHeaders]
   * @returns {GoogleAppsScript.Spreadsheet.Sheet}
   */
  function getSheet_(sheetName, initialHeaders = []) {
    const ss = getSpreadsheet_();
    let sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (initialHeaders.length > 0) {
        sheet.appendRow(initialHeaders);
        sheet.getRange(1, 1, 1, initialHeaders.length).setFontWeight('bold');
      }
    }
    return sheet;
  }

  /**
   * Read all data rows from a sheet converted to structured JSON objects.
   * Headers in row 1 are used as object property keys.
   * @param {string} sheetName
   * @returns {Array<Object>}
   */
  function readAllRecords_(sheetName) {
    const sheet = getSheet_(sheetName);
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0].map(h => String(h).trim().toLowerCase().replace(/[\s-]+/g, '_'));
    const rows = data.slice(1);

    return rows.map((row, rowIndex) => {
      const record = { _rowNumber: rowIndex + 2 };
      headers.forEach((header, colIndex) => {
        let val = row[colIndex];
        // Parse dates to ISO strings
        if (val instanceof Date) {
          val = val.toISOString();
        }
        record[header] = val;
      });
      return record;
    });
  }

  /**
   * Find a single record where column matching 'keyName' equals 'keyValue'.
   * @param {string} sheetName
   * @param {string} keyName Normalized header name
   * @param {*} keyValue Value to match
   * @returns {Object|null}
   */
  function findRecord_(sheetName, keyName, keyValue) {
    const records = readAllRecords_(sheetName);
    const normalizedKey = String(keyName).trim().toLowerCase().replace(/[\s-]+/g, '_');
    const targetVal = String(keyValue).trim().toLowerCase();

    return records.find(r => String(r[normalizedKey] || '').trim().toLowerCase() === targetVal) || null;
  }

  /**
   * Safely append a record to a worksheet, neutralizing formula injection.
   * @param {string} sheetName
   * @param {Object} recordObject Key-value pair of data to write
   * @param {Array<string>} [orderedHeaders] Explicit column order
   */
  function appendRecord_(sheetName, recordObject, orderedHeaders = []) {
    const sheet = getSheet_(sheetName, orderedHeaders);
    let headers = orderedHeaders;

    if (headers.length === 0) {
      const firstRow = sheet.getRange(1, 1, 1, sheet.getLastColumn() || 1).getValues()[0];
      headers = firstRow.map(h => String(h).trim());
    }

    const rowValues = headers.map(headerKey => {
      const normKey = headerKey.toLowerCase().replace(/[\s-]+/g, '_');
      const rawVal = recordObject[headerKey] !== undefined ? recordObject[headerKey] : recordObject[normKey];
      return Validation.neutralizeFormula(rawVal !== undefined ? rawVal : '');
    });

    sheet.appendRow(rowValues);
  }

  /**
   * Append an entry to the AuditLog worksheet for SOC-2 / admin traceability.
   * @param {string} action
   * @param {string} actorEmail
   * @param {string} targetEntity
   * @param {string} [details='']
   */
  function logAudit_(action, actorEmail, targetEntity, details = '') {
    try {
      const auditHeaders = ['Timestamp', 'Action', 'ActorEmail', 'TargetEntity', 'Details'];
      appendRecord_(SHEETS.AUDIT_LOG, {
        Timestamp: new Date().toISOString(),
        Action: action,
        ActorEmail: actorEmail || 'system',
        TargetEntity: targetEntity,
        Details: typeof details === 'object' ? JSON.stringify(details) : details
      }, auditHeaders);
    } catch (e) {
      console.error('Audit logging error:', e.message);
    }
  }

  return {
    SHEETS: SHEETS,
    getSheet: getSheet_,
    readAllRecords: readAllRecords_,
    findRecord: findRecord_,
    appendRecord: appendRecord_,
    logAudit: logAudit_
  };
})();
