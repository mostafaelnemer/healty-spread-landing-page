// ─── Healthy Spread — Google Apps Script ─────────────────────────────────────
// 1. افتح Google Sheet جديد
// 2. Extensions → Apps Script → الصق الكود ده
// 3. Deploy → New deployment → Web app
//    Execute as: Me | Who has access: Anyone
// 4. انسخ الـ URL وحطه في StepConfirm.jsx مكان ORDER_API_URL

// ─── Meta CAPI Config ────────────────────────────────────────────────────────
var META_PIXEL_ID    = '2211139682969128';
var META_ACCESS_TOKEN = 'EAAO52NIqswoBR3b5OimOVNcksxaaFFiMylQ8CghlwQPBkkArpuFLQLoztxhZALG6Md3bJ9nWq5PVZCVBN1mSsi9hNTEtyKNCHKqWxgBa7YvWIMT8loma1JdTfesbXXzFoPQGmDKaM5NZAqW7EcpyzWlwmeleCoTFdQWogeAtU7Kt9vOw19WvN6iSKaBbwZDZD';
var META_CAPI_URL    = 'https://graph.facebook.com/v19.0/' + META_PIXEL_ID + '/events?access_token=' + META_ACCESS_TOKEN;

var HEADERS = [
  'Order ID',   // A
  'التاريخ',    // B
  'الوقت',      // C
  'الاسم',      // D
  'الموبايل',   // E
  'المحافظة',   // F
  'العنوان',    // G
  'ملاحظات',    // H
  'العرض',      // I
  'النكهات',    // J
  'الكمية',     // K
  'السعر',      // L
];

function doPost(e) { return handleRequest(e); }
function doGet(e)  { return handleRequest(e); }

function handleRequest(e) {
  // Use a lock so concurrent requests don't race and create duplicates
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonOutput({ result: 'error', error: 'Could not acquire lock' });
  }

  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Write headers only when the sheet is empty
    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    var p = e.parameter || {};
    var orderId = (p.orderId || '').trim();

    // ── Deduplication ────────────────────────────────────────────────────────
    // If this orderId was already recorded, skip and return success quietly.
    // This handles: double-taps, network retries, Apps Script internal retries.
    if (orderId && isDuplicate(sheet, orderId)) {
      return jsonOutput({ result: 'duplicate', orderId: orderId });
    }

    var now  = new Date();
    var date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

    sheet.appendRow([
      orderId,           // A - Order ID
      date,              // B - التاريخ
      time,              // C - الوقت
      p.name     || '',  // D - الاسم
      p.phone    || '',  // E - الموبايل
      p.gov      || '',  // F - المحافظة
      p.address  || '',  // G - العنوان
      p.notes    || '',  // H - ملاحظات
      p.bundle   || '',  // I - العرض
      p.flavors  || '-', // J - النكهات
      p.quantity || '1', // K - الكمية
      p.price    || '',  // L - السعر
    ]);

    sendMetaPurchase(p, orderId, now);

    return jsonOutput({ result: 'success', orderId: orderId });

  } catch (err) {
    Logger.log('Error: ' + err.message);
    return jsonOutput({ result: 'error', error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function sendMetaPurchase(p, orderId, eventTime) {
  try {
    // Parse the numeric value from the price string, e.g. "450 جنيه ..."
    var value = parseFloat((p.price || '0').replace(/[^0-9.]/g, '')) || 0;

    // Normalise phone: strip spaces/dashes, ensure it starts with country code
    var rawPhone = (p.phone || '').replace(/[\s\-]/g, '');
    // Egyptian numbers: 01XXXXXXXXX → 201XXXXXXXXX
    if (rawPhone.startsWith('0')) rawPhone = '2' + rawPhone;

    var eventData = {
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(eventTime.getTime() / 1000), // Unix timestamp
          event_id: orderId,        // ← same ID the browser pixel sent
          action_source: 'website',
          user_data: {
            // Hashed phone (SHA-256) — Meta requires hashed PII
            ph: [hashSHA256(rawPhone)],
          },
          custom_data: {
            currency: 'EGP',
            value: value,
            order_id: orderId,
            content_type: 'product',
          },
        },
      ],
    };

    var options = {
      method: 'POST',
      contentType: 'application/json',
      payload: JSON.stringify(eventData),
      muteHttpExceptions: true,
    };

    var response = UrlFetchApp.fetch(META_CAPI_URL, options);
    Logger.log('Meta CAPI response: ' + response.getContentText());

  } catch (err) {
    // CAPI failure must never block the order — just log it
    Logger.log('Meta CAPI error: ' + err.message);
  }
}

function hashSHA256(value) {
  if (!value) return '';
  var normalized = value.toString().toLowerCase().trim();
  var bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    normalized,
    Utilities.Charset.UTF_8
  );
  return bytes.map(function(b) {
    return ('0' + (b & 0xff).toString(16)).slice(-2);
  }).join('');
}

/**
 * Returns true if an orderId already exists in column A (skip row 1 = headers).
 * Only checks the last 200 rows for performance — orders older than that
 * can't realistically be retried.
 */
function isDuplicate(sheet, orderId) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;

  var startRow = Math.max(2, lastRow - 199);
  var numRows  = lastRow - startRow + 1;
  var values   = sheet.getRange(startRow, 1, numRows, 1).getValues();

  for (var i = 0; i < values.length; i++) {
    if (String(values[i][0]).trim() === orderId) return true;
  }
  return false;
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
