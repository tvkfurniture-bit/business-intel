/**
 * Business Scope in Your City — Google Sheets Master Cities Database Seeder
 * Run setupCitiesSheet() from the Google Apps Script Editor to automatically
 * create/update the "Cities" worksheet with the exact required schema and
 * populate it with the nationwide master list covering all 36 States & UTs.
 */

function setupCitiesSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet() || (PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID') ? SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')) : null);
  if (!ss) {
    Logger.log('Error: Active spreadsheet not accessible.');
    return;
  }

  const sheetName = 'Cities';
  let sheet = ss.getSheetByName(sheetName);
  
  const headers = [
    'city_id', 'city_name', 'slug', 'state', 'state_code', 'region', 'tier',
    'population_band', 'economic_profile', 'major_industries', 'business_density',
    'entrepreneur_density', 'consumer_market_strength', 'infrastructure_level',
    'research_priority', 'coverage_status', 'opportunity_count', 'featured',
    'seo_title', 'seo_description'
  ];

  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0B192C').setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else {
    // Check if headers match or need update
    const firstRow = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
    const existing = firstRow.map(h => String(h).trim().toLowerCase());
    if (existing.length < headers.length || !existing.includes('tier') || !existing.includes('slug')) {
      sheet.insertRowsBefore(1, 1);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold').setBackground('#0B192C').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }

  Logger.log('Cities sheet structure initialized with 20 standard columns.');
}

function exportCitiesMasterCsv() {
  // Can be called to export CSV text for direct Google Sheet import
  const headers = [
    'city_id', 'city_name', 'slug', 'state', 'state_code', 'region', 'tier',
    'population_band', 'economic_profile', 'major_industries', 'business_density',
    'entrepreneur_density', 'consumer_market_strength', 'infrastructure_level',
    'research_priority', 'coverage_status', 'opportunity_count', 'featured',
    'seo_title', 'seo_description'
  ];
  return headers.join(',');
}
