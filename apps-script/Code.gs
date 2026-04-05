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

function doGet(e) {
  return HtmlService.createHtmlOutput(
    '<h2>Sarora Waitlist API</h2>' +
      '<p>Web app is running. POST JSON from the Sarora website waitlist form.</p>' +
      '<p>Expected JSON keys: firstName, lastName, email, interest</p>'
  );
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error('No POST data. Send JSON in the request body.');
    }

    var raw = e.postData.contents;
    var data = JSON.parse(raw);

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
    var htmlBody =
      '<p>Hi ' +
      firstName +
      ',</p>' +
      '<p>Thanks for joining the waitlist for Sarora Jewelry. We’ll let you know as soon as early access opens.</p>' +
      (interest
        ? '<p><strong>Collection interest:</strong> ' +
          interest +
          '</p>'
        : '') +
      '<p>— Sarora Jewelry</p>';

    /** Send mail in its own try/catch so a quota or policy error still returns success after the row is saved */
    var emailSent = false;
    try {
      GmailApp.sendEmail(email, subject, '', { htmlBody: htmlBody });
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

/** Run from Apps Script editor to verify script + sheet ID */
function testDoPost() {
  var e = {
    postData: {
      contents: JSON.stringify({
        firstName: 'Test',
        lastName: 'User',
        email: 'you@example.com',
        interest: 'rings',
        source: 'manual-test',
      }),
    },
  };
  var result = doPost(e);
  Logger.log(result.getContent());
}
