/* Booking form leads -> Google Sheet "Клиент-база".
 *
 * Paste this into the sheet's Extensions > Apps Script, set SECRET, then
 * Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * The /exec URL goes into the Worker as SHEETS_WEBHOOK_URL and SECRET as
 * SHEETS_SECRET. src/worker.js posts here after Telegram accepts the lead.
 *
 * Vouchers ("Voucher upominkowy") go to the "Bony" tab, everything else to
 * "Website form". Column order must match the header rows below.
 */

const SECRET = 'PASTE-THE-SAME-RANDOM-STRING-AS-SHEETS_SECRET';

const LEADS_SHEET = 'Website form';
const BONY_SHEET = 'Bony';
const VOUCHER = 'Voucher upominkowy';

const BONY_HEADERS = [
  'Data', 'Imię i nazwisko', 'Telefon', 'E-mail', 'Kwota (zł)',
  'Wiadomość', 'Zgoda', 'Źródło', 'Status',
];

function doPost(e) {
  let d;
  try {
    d = JSON.parse(e.postData.contents);
  } catch (err) {
    return reply({ ok: false, error: 'bad_json' });
  }
  if (!d || d.secret !== SECRET) return reply({ ok: false, error: 'forbidden' });

  // Two leads arriving together must not land on the same row.
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const now = new Date();

    if (d.service === VOUCHER) {
      const sheet = book.getSheetByName(BONY_SHEET) || book.insertSheet(BONY_SHEET);
      if (sheet.getLastRow() === 0) {
        sheet.appendRow(BONY_HEADERS);
        sheet.getRange(1, 1, 1, BONY_HEADERS.length).setFontWeight('bold');
        sheet.setFrozenRows(1);
      }
      // The cennik page writes "Voucher upominkowy na kwotę 300 zł." into the note.
      const m = /na kwotę\s*(\d[\d\s]*)/.exec(d.note || '');
      sheet.appendRow([
        now, d.name, d.phone, d.email, m ? Number(m[1].replace(/\s/g, '')) : '',
        d.note, 'tak', 'Strona www', 'Nowy',
      ]);
    } else {
      const sheet = book.getSheetByName(LEADS_SHEET);
      // Data | Imię i nazwisko | Telefon | E-mail | Zabieg | Długość zabiegu |
      // Terapeutka | Preferowana data | Preferowana godzina | Wiadomość |
      // Nazwa firmy | Zgoda | Źródło
      sheet.appendRow([
        now, d.name, d.phone, d.email, d.service, d.duration,
        d.therapist, d.date, d.time, d.note,
        '', 'tak', 'Strona www',
      ]);
    }
  } finally {
    lock.releaseLock();
  }
  return reply({ ok: true });
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
