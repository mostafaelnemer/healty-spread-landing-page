// ─── Healthy Spread — Google Apps Script ─────────────────────────────────────
// 1. افتح Google Sheet جديد
// 2. Extensions → Apps Script → الصق الكود ده
// 3. Deploy → New deployment → Web app
//    Execute as: Me | Who has access: Anyone
// 4. انسخ الـ URL وحطه في StepConfirm.jsx مكان PASTE_APPS_SCRIPT_URL_HERE

var HEADERS = [
  'التاريخ',    // A
  'الوقت',      // B
  'الاسم',      // C
  'الموبايل',   // D
  'المحافظة',   // E
  'العنوان',    // F
  'ملاحظات',    // G
  'العرض',      // H
  'النكهات',    // I
  'الكمية',     // J
  'السعر',      // K
];

function doPost(e) { return handleRequest(e); }
function doGet(e)  { return handleRequest(e); }

function handleRequest(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // headers في أول صف بس لو الشيت فاضي
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    var now  = new Date();
    var date = now.toLocaleDateString('ar-EG');   // مثال: 25/5/2026
    var time = now.toLocaleTimeString('ar-EG');   // مثال: 11:30:00 م

    var p = e.parameter || {};

    sheet.appendRow([
      date,              // A - التاريخ
      time,              // B - الوقت
      p.name     || '',  // C - الاسم
      p.phone    || '',  // D - الموبايل
      p.gov      || '',  // E - المحافظة
      p.address  || '',  // F - العنوان
      p.notes    || '',  // G - ملاحظات
      p.bundle   || '',  // H - العرض
      p.flavors  || '-', // I - النكهات
      p.quantity || '1', // J - الكمية
      p.price    || '',  // K - السعر
    ]);

    return jsonOutput({ result: 'success' });

  } catch (err) {
    Logger.log('Error: ' + err.message);
    return jsonOutput({ result: 'error', error: err.message });
  }
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
