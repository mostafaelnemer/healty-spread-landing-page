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

// ── CORS preflight: browsers send OPTIONS before POST cross-origin.
// Apps Script doesn't natively handle OPTIONS, so we return 200 immediately.
function doOptions(e) {
  return ContentService
    .createTextOutput('')
    .setMimeType(ContentService.MimeType.TEXT);
}

// POST is the primary method (avoids the 302-redirect double-execution
// that GET requests cause on Apps Script web apps).
// GET is kept as a fallback for direct URL testing only.
function doPost(e) { return handleRequest(e); }
function doGet(e)  { return handleRequest(e); }

function handleRequest(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
  } catch (err) {
    return jsonOutput({ result: 'error', error: 'Could not acquire lock' });
  }

  try {
    // ── Parse params: support both POST JSON body and GET URL params.
    // POST body is preferred (no redirect issue). GET params are a fallback.
    var p = {};
    if (e.postData && e.postData.contents) {
      try {
        p = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        p = e.parameter || {};
      }
    } else {
      p = e.parameter || {};
    }

    var orderId = (p.orderId || '').trim();

    // ── CRITICAL: reject requests with no orderId — they cannot be deduped.
    if (!orderId) {
      return jsonOutput({ result: 'error', error: 'Missing orderId' });
    }

    // ── Dedup check (inside the lock, so it's race-condition safe).
    if (isDuplicate(orderId)) {
      Logger.log('Duplicate orderId rejected: ' + orderId);
      return jsonOutput({ result: 'duplicate', orderId: orderId, shouldTrackPixel: false });
    }

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
      p.price    || '',
    ]);

    sendMetaPurchase(p, orderId, now);

    return jsonOutput({ result: 'success', orderId: orderId, eventId: orderId, shouldTrackPixel: true });

  } catch (err) {
    Logger.log('Error: ' + err.message);
    return jsonOutput({ result: 'error', error: err.message });
  } finally {
    lock.releaseLock();
  }
}

function sendMetaPurchase(p, orderId, eventTime) {
  try {
    var value = parseFloat((p.price || '0').replace(/[^0-9.]/g, '')) || 0;

    var rawPhone = (p.phone || '').replace(/[\s\-]/g, '');
    if (rawPhone.startsWith('0')) rawPhone = '2' + rawPhone;

    var eventData = {
      data: [{
        event_name: 'Purchase',
        event_time: Math.floor(eventTime.getTime() / 1000),
        event_id: orderId,
        action_source: 'website',
        user_data: {
          ph: [hashSHA256(rawPhone)],
        },
        custom_data: {
          currency: 'EGP',
          value: value,
          order_id: orderId,
          content_type: 'product',
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

  // Write to dedup sheet BEFORE returning — so if we crash after this
  // but before appendRow, we don't write a duplicate on retry.
  dedup.appendRow([orderId, new Date().toISOString()]);
  return false;
}

function jsonOutput(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
