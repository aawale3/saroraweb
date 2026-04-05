/**
 * Sarora Jewelry — Waitlist Web App (Google Apps Script)
 *
 * SETUP:
 * 1. Create a new Google Sheet (Sheets → New). Name it e.g. "Sarora Waitlist".
 * 2. Copy the Sheet ID from the URL:
 *    https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit
 * 3. Replace SPREADSHEET_ID below with that ID.
 * 4. Optional: set NOTIFY_EMAIL to your team inbox to get a row notification.
 * 5. Deploy: Extensions → Apps Script → paste this file → Deploy → New deployment
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone (needed for public website form)
 * 6. Copy the Web app URL and put it in index.html as WAITLIST_API_URL
 */

var SPREADSHEET_ID = '1doSVLWyBdwGm-hmDMYrSShs_rdEBxL8hFhqfDNt_3Ms';
var SHEET_NAME = 'Waitlist';

/** Optional: your team email for a BCC or separate log email (leave '' to skip) */
var NOTIFY_EMAIL = '';

/** Public site base URL (no trailing slash) — logo + footer links in emails */
var PUBLIC_SITE_URL = 'https://www.sarorajewelry.com';

var INSTAGRAM_URL = 'https://www.instagram.com/sarorajewelry/';

/**
 * Optional: Google Drive file ID for your logo (from the link …/file/d/THIS_ID/view).
 * The script runs as you, so the file must be in Drive you can open. Prefer uploading a PNG;
 * SVG often does not display in Gmail and other clients when embedded.
 */
var LOGO_DRIVE_FILE_ID = '1sW8ArxfTbel4ysh2arDgUp6HSlSnC8AI';

/**
 * Fallback URLs if Drive isn’t used or fails. Inline-embed in email (cid:logo).
 */
var LOGO_IMAGE_URLS = [
  'https://raw.githubusercontent.com/aawale3/saroraweb/main/images/logo.png',
  'https://www.sarorajewelry.com/images/logo.png',
];

function fetchLogoBlob_() {
  if (LOGO_DRIVE_FILE_ID && String(LOGO_DRIVE_FILE_ID).length > 10) {
    try {
      var file = DriveApp.getFileById(LOGO_DRIVE_FILE_ID);
      var blob = file.getBlob();
      if (blob && blob.getBytes().length > 50) {
        var fname = file.getName() || 'logo.png';
        return blob.setName(fname);
      }
    } catch (err) {
      Logger.log('Drive logo failed: ' + err.message);
    }
  }
  for (var i = 0; i < LOGO_IMAGE_URLS.length; i++) {
    try {
      var r = UrlFetchApp.fetch(LOGO_IMAGE_URLS[i], {
        muteHttpExceptions: true,
        followRedirects: true,
      });
      if (r.getResponseCode() === 200) {
        var b = r.getBlob();
        if (b && b.getBytes().length > 200) {
          return b.setName('logo.png');
        }
      }
    } catch (err) {
      Logger.log('Logo fetch failed: ' + LOGO_IMAGE_URLS[i] + ' — ' + err.message);
    }
  }
  return null;
}

function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Human label for waitlist interest (matches form values in index.html) */
function interestCopy(interestKey) {
  var k = (interestKey || '').toLowerCase();
  if (k === 'all' || k === '')
    return {
      isAll: true,
      label: 'all our collections',
    };
  var labels = {
    rings: 'Rings',
    necklaces: 'Necklaces',
    pendants: 'Pendants',
    bracelets: 'Bracelets',
    earrings: 'Earrings',
  };
  return {
    isAll: false,
    label: labels[k] || interestKey,
  };
}

function buildWaitlistEmailHtml(firstName, interestKey, hasInlineLogo) {
  var safeName = escapeHtml(firstName);
  var ic = interestCopy(interestKey);
  var interestParagraph = ic.isAll
    ? "We noticed you’re interested in <strong>all our collections</strong>—which means you’re going to get the ultimate VIP treatment. We’re working hard behind the scenes, and we promise the wait will be worth it."
    : "We noticed you’re especially excited about <strong>" +
      escapeHtml(ic.label) +
      '</strong>—thank you for telling us. We’re working hard behind the scenes, and we promise the wait will be worth it.';

  var logoBlock = hasInlineLogo
    ? '<img src="cid:logo" alt="Sarora Jewelry" width="140" style="max-width:160px;height:auto;display:inline-block;margin-bottom:28px;border:0;" />'
    : '<div style="font-family:Georgia,\'Times New Roman\',serif;font-size:22px;letter-spacing:0.28em;color:#1E0F06;margin-bottom:24px;font-weight:600;">SARORA</div>';

  return (
    '<div style="margin:0;padding:0;background-color:#FAF8F3;font-family:Georgia,Times,serif;color:#1E0F06;">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#FAF8F3;padding:32px 16px;">' +
    '<tr><td align="center">' +
    '<table role="presentation" width="100%" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid rgba(201,168,76,0.22);">' +
    '<tr><td style="padding:40px 36px 32px;text-align:center;">' +
    logoBlock +
    '<p style="margin:0 0 20px;font-size:17px;line-height:1.6;text-align:left;font-family:Arial,Helvetica,sans-serif;">Hi ' +
    safeName +
    ',</p>' +
    '<p style="margin:0 0 18px;font-size:15px;line-height:1.75;text-align:left;font-family:Arial,Helvetica,sans-serif;color:#4A2E1A;">We’re so thrilled you’re here! Thank you for joining the waitlist for <strong>Sarora Jewelry</strong>.</p>' +
    '<p style="margin:0 0 18px;font-size:15px;line-height:1.75;text-align:left;font-family:Arial,Helvetica,sans-serif;color:#4A2E1A;">' +
    interestParagraph +
    '</p>' +
    '<p style="margin:0 0 18px;font-size:15px;line-height:1.75;text-align:left;font-family:Arial,Helvetica,sans-serif;color:#4A2E1A;">Keep an eye on your inbox. We’ll notify you the exact second our early access doors open so you can shop before anyone else.</p>' +
    '<p style="margin:24px 0 0;font-size:15px;line-height:1.6;text-align:left;font-family:Arial,Helvetica,sans-serif;color:#4A2E1A;">Talk soon,<br /><strong>Sarora Jewelry</strong></p>' +
    '</td></tr>' +
    '<tr><td style="padding:0 36px 36px;text-align:center;border-top:1px solid rgba(201,168,76,0.25);">' +
    '<p style="margin:20px 0 0;font-size:12px;letter-spacing:0.12em;font-family:Arial,Helvetica,sans-serif;">' +
    '<a href="' +
    PUBLIC_SITE_URL +
    '" style="color:#9E7A2E;text-decoration:none;">Website</a>' +
    ' &nbsp;|&nbsp; ' +
    '<a href="' +
    INSTAGRAM_URL +
    '" style="color:#9E7A2E;text-decoration:none;">Instagram</a>' +
    '</p>' +
    '</td></tr></table></td></tr></table></div>'
  );
}

function buildWaitlistEmailPlain(firstName, interestKey) {
  var ic = interestCopy(interestKey);
  var mid = ic.isAll
    ? "We noticed you're interested in all our collections—which means you're going to get the ultimate VIP treatment."
    : "We're especially glad you shared your interest in " + ic.label + '.';
  return (
    'Hi ' +
    firstName +
    ',\n\n' +
    "We're so thrilled you're here! Thank you for joining the waitlist for Sarora Jewelry.\n\n" +
    mid +
    '\n\n' +
    "Keep an eye on your inbox. We'll notify you the exact second our early access doors open.\n\n" +
    'Talk soon,\n' +
    'Sarora Jewelry\n\n' +
    PUBLIC_SITE_URL +
    ' | ' +
    INSTAGRAM_URL
  );
}

/**
 * GET with no query → simple HTML (health check in browser).
 * GET ?stats=count → JSON only: { status, count } — number of data rows in Waitlist (excludes header). No names/emails.
 * Optional: set STATS_SECRET in Project Settings → Script properties; then require ?stats=count&key=YOUR_SECRET
 */
function doGet(e) {
  e = e || { parameter: {} };
  var p = e.parameter || {};
  if (p.stats === 'count') {
    var secret = PropertiesService.getScriptProperties().getProperty('STATS_SECRET');
    if (secret && String(secret).length > 0 && p.key !== secret) {
      return jsonOut({ status: 'error', message: 'Invalid or missing key for stats' });
    }
    try {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var sh = ss.getSheetByName(SHEET_NAME);
      if (!sh) {
        return jsonOut({ status: 'ok', count: 0 });
      }
      var last = sh.getLastRow();
      var count = last <= 1 ? 0 : last - 1;
      return jsonOut({ status: 'ok', count: count });
    } catch (err) {
      Logger.log('doGet stats: ' + err.message);
      return jsonOut({ status: 'error', message: String(err.message || err) });
    }
  }
  return HtmlService.createHtmlOutput(
    '<h2>Sarora Waitlist API</h2>' +
      '<p>Web app is running.</p>' +
      '<p>POST <code>application/x-www-form-urlencoded</code> (recommended) or JSON body with: firstName, lastName, email, interest</p>' +
      '<p>GET <code>?stats=count</code> → JSON aggregate signup count (no personal data).</p>'
  );
}

/** Form POST fills e.parameter; JSON POST uses postData.contents — support both */
function loadPayload(e) {
  if (!e) throw new Error('No event object');
  if (e.parameter && (e.parameter.email || e.parameter.firstName)) {
    return {
      firstName: String(e.parameter.firstName || ''),
      lastName: String(e.parameter.lastName || ''),
      email: String(e.parameter.email || ''),
      interest: String(e.parameter.interest || ''),
      source: String(e.parameter.source || 'saroraweb'),
    };
  }
  if (e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  throw new Error('No POST data (use form fields or JSON body).');
}

function doPost(e) {
  try {
    var data = loadPayload(e);

    var firstName = (data.firstName || '').trim();
    var lastName = (data.lastName || '').trim();
    var email = (data.email || '').trim().toLowerCase();
    var interest = (data.interest || '').trim();
    var source = (data.source || 'saroraweb').trim();

    if (!firstName) throw new Error('First name is required');
    if (!lastName) throw new Error('Last name is required');
    if (!email) throw new Error('Email is required');

    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    var sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
    }

    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'First Name',
        'Last Name',
        'Email',
        'Interest',
        'Source',
      ]);
    }

    sheet.appendRow([new Date(), firstName, lastName, email, interest, source]);

    var displayName = firstName + ' ' + lastName;
    var subject = "You're on the Sarora waitlist ✦";
    var logoBlob = fetchLogoBlob_();
    var htmlBody = buildWaitlistEmailHtml(firstName, interest, !!logoBlob);
    var plainBody = buildWaitlistEmailPlain(firstName, interest);

    /** Send mail in its own try/catch so a quota or policy error still returns success after the row is saved */
    var emailSent = false;
    try {
      var mailOpts = { htmlBody: htmlBody };
      if (logoBlob) {
        mailOpts.inlineImages = { logo: logoBlob };
      }
      GmailApp.sendEmail(email, subject, plainBody, mailOpts);
      emailSent = true;
    } catch (mailErr) {
      Logger.log('GmailApp.sendEmail failed: ' + mailErr.message);
    }

    if (NOTIFY_EMAIL) {
      try {
        GmailApp.sendEmail(
          NOTIFY_EMAIL,
          '[Sarora Waitlist] ' + displayName,
          'Email: ' + email + '\nInterest: ' + interest
        );
      } catch (nErr) {
        Logger.log('NOTIFY_EMAIL failed: ' + nErr.message);
      }
    }

    return jsonOut({
      status: 'success',
      message: 'Submission received',
      emailSent: emailSent,
    });
  } catch (err) {
    Logger.log('doPost error: ' + err.message);
    return jsonOut({ status: 'error', message: err.message });
  }
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/** Run from Apps Script editor — mimics browser form POST */
function testDoPost() {
  var e = {
    parameter: {
      firstName: 'Test',
      lastName: 'User',
      email: 'you@example.com',
      interest: 'rings',
      source: 'manual-test',
    },
  };
  var result = doPost(e);
  Logger.log(result.getContent());
}
