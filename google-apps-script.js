var META_PIXEL_ID     = '2211139682969128';
var META_ACCESS_TOKEN = 'EAAO52NIqswoBR3b5OimOVNcksxaaFFiMylQ8CghlwQPBkkArpuFLQLoztxhZALG6Md3bJ9nWq5PVZCVBN1mSsi9hNTEtyKNCHKqWxgBa7YvWIMT8loma1JdTfesbXXzFoPQGmDKaM5NZAqW7EcpyzWlwmeleCoTFdQWogeAtU7Kt9vOw19WvN6iSKaBbwZDZD';
var META_CAPI_URL     = 'https://graph.facebook.com/v19.0/' + META_PIXEL_ID + '/events?access_token=' + META_ACCESS_TOKEN;

var HEADERS = [
  'التاريخ',
  'الوقت',
  'الاسم',
  'الموبايل',
  'المحافظة',
  'العنوان',
  'ملاحظات',
  'العرض',
  'النكهات',
  'الكمية',
  'السعر',
];

function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

function doPost(e) { return handleRequest(e); }
function doGet(e)  { return handleRequest(e); }

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonOutput({ result: 'error', error: 'Could not acquire lock' });
  }

  // ── CHANGED: critical section is now ONLY check + reserve. The lock is
  // ── released in `finally` below, so everything after it (sheet write +
  // ── Meta CAPI call) runs lock-free and concurrent orders run in parallel
  // ── instead of queueing behind each other's 1-5s CAPI round-trip.
  var p = {};
  var orderId = '';
  try {
    if (e.postData && e.postData.contents) {
      try {
        p = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        p = e.parameter || {};
      }
    } else {
      p = e.parameter || {};
    }

    // CHANGED: String() hardening so a numeric orderId can't throw here
    // (previously `.trim()` on a number threw straight to the error path).
    orderId = String(p.orderId || '').trim();

    if (!orderId) {
      return jsonOutput({ result: 'error', error: 'Missing orderId' });
    }

    // CHANGED: this is the ONLY duplicate logic and it is untouched —
    // isDuplicate() atomically checks + appends the reservation while the
    // lock is held, so the same orderId arriving the same millisecond is
    // still rejected here, before any slow work starts.
    if (isDuplicate(orderId)) {
      Logger.log('Duplicate orderId rejected: ' + orderId);
      return jsonOutput({ result: 'duplicate', orderId: orderId, shouldTrackPixel: false });
    }
  } finally {
    // CHANGED: lock released HERE (was: held until the final response).
    // Runs on every path above, including early returns and throws.
    lock.releaseLock();
  }

  // ── CHANGED: slow section, deliberately lock-free from here on.
  // appendRow is atomic per call and CAPI uses unique event_ids, so
  // concurrent DIFFERENT orders are safe in parallel.
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    if (sheet.getLastRow() === 0) {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    }

    var now  = new Date();
    var date = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    var time = Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm:ss');

    sheet.appendRow([
      date,
      time,
      p.name     || '',
      p.phone    || '',
      p.gov      || '',
      p.address  || '',
      p.notes    || '',
      p.bundle   || '',
      p.flavors  || '-',
      p.quantity || '1',
      p.price ? (p.price + ' جنيه') : '',
    ]);

    sendMetaPurchase(p, orderId, now);

    return jsonOutput({ result: 'success', orderId: orderId, eventId: orderId, shouldTrackPixel: true });

  } catch (err) {
    Logger.log('Error: ' + err.message);
    // CHANGED: the orderId is already reserved in _dedup but the row was
    // never written — release the reservation so a retry with the same
    // orderId can proceed instead of being rejected as a "duplicate" ghost.
    // (CAPI failures never reach here: sendMetaPurchase swallows its own
    // errors internally, so reaching this branch means the SHEET write
    // itself failed.)
    removeReservation(orderId);
    return jsonOutput({ result: 'error', error: err.message });
  }
}

// CHANGED (new helper): deletes one orderId reservation from _dedup so a
// failed attempt can be retried. Takes the lock itself for a few ms so the
// find + delete is atomic against concurrent isDuplicate() scans.
function removeReservation(orderId) {
  if (!orderId) return;
  try {
    var lock = LockService.getScriptLock();
    try {
      lock.waitLock(5000);
    } catch (lockErr) {
      Logger.log('removeReservation: lock busy, keeping reservation for ' + orderId);
      return;
    }
    try {
      var dedup = getDedupSheet();
      var lastRow = dedup.getLastRow();
      if (lastRow === 0) return;
      var startRow = Math.max(1, lastRow - 999);
      var numRows  = lastRow - startRow + 1;
      var values   = dedup.getRange(startRow, 1, numRows, 1).getValues();
      // Scan from the end: our own reservation is the most recent match
      // (orderIds are unique, so at most one row can match).
      for (var i = numRows - 1; i >= 0; i--) {
        if (String(values[i][0]).trim() === orderId) {
          dedup.deleteRow(startRow + i);
          Logger.log('removeReservation: released ' + orderId);
          return;
        }
      }
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    Logger.log('removeReservation error: ' + err.message);
  }
}

function sendMetaPurchase(p, orderId, eventTime) {
  try {
    var rawValue = parseFloat(String(p.price || '0').replace(/[^0-9.\-]/g, ''));
    var value = isNaN(rawValue) ? 0 : Math.round(rawValue * 100) / 100;
    if (!(value > 0)) {
      Logger.log('Meta CAPI skipped: invalid value for order ' + orderId + ' (price=' + p.price + ')');
      return;
    }

    var rawPhone = (p.phone || '').replace(/[\s\-]/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '2' + rawPhone;

    var userData = {
      ph: [hashSHA256(rawPhone)],
    };
    if (p.fbp) userData.fbp = p.fbp;
    if (p.fbc) userData.fbc = p.fbc;

    var qty = parseInt(p.quantity, 10) || 1;
    if (qty < 1) qty = 1;
    var itemPrice = Math.round((value / qty) * 100) / 100;
    var contentId = (p.bundle || 'offer').toString().slice(0, 100);

    var eventData = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(eventTime.getTime() / 1000),
        event_id: orderId,
        action_source: 'website',
        user_data: userData,
        custom_data: {
          currency: 'EGP',
          value: value,
          order_id: orderId,
          content_type: 'product',
          content_ids: [contentId],
          contents: [{ id: contentId, quantity: qty, item_price: itemPrice }],
          num_items: qty,
        },
      }],
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

function getDedupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var dedup = ss.getSheetByName('_dedup');
  if (!dedup) {
    dedup = ss.insertSheet('_dedup');
    dedup.hideSheet();
  }
  return dedup;
}

function isDuplicate(orderId) {
  var dedup = getDedupSheet();
  var lastRow = dedup.getLastRow();

  if (lastRow > 0) {
    var startRow = Math.max(1, lastRow - 999);
    var numRows  = lastRow - startRow + 1;
    var values   = dedup.getRange(startRow, 1, numRows, 1).getValues();
    for (var i = 0; i < values.length; i++) {
      if (String(values[i][0]).trim() === orderId) return true;
    }
  }

  dedup.appendRow([orderId, new Date().toISOString()]);
  return false;
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
