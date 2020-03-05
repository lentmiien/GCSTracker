// Require used packages
const { GoogleSpreadsheet } = require('google-spreadsheet');

// Google sheet credentials
const creds = {
  type: process.env.GSHEET_TYPE,
  project_id: process.env.GSHEET_PROJECT_ID,
  private_key_id: process.env.GSHEET_PRIVATE_KEY_ID,
  private_key: process.env.GSHEET_PRIVATE_KEY.replace(/\\n/g, '\n'),
  client_email: process.env.GSHEET_CLIENT_EMAIL,
  client_id: process.env.GSHEET_CLIENT_ID,
  auth_uri: process.env.GSHEET_AUTH_URI,
  token_uri: process.env.GSHEET_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GSHEET_AUTH_PROVIDER_X509_CERT_URL,
  client_x509_cert_url: process.env.GSHEET_CLIENT_X509_CERT_URL
};

//---------------------------------------------//
// exports.endpoints = (req, res, next) => {}; //
//---------------------------------------------//

// API routes

// POST add new records
exports.api_add = async (req, res) => {
  const api_key = req.header('api-key');
  if (api_key == undefined) {
    return res.json({ status: 'Error: No API key' });
  }
  if (api_key != process.env.THIS_API_KEY) {
    return res.json({ status: 'Error: Invalid API key' });
  }

  // Do not start adding if currently adding records
  if (add_progress >= 0 && add_progress < 1) {
    return res.json({ status: 'Error: Busy' });
  }
  // Do not start adding if currently tracking
  if (track_progress >= 0 && track_progress < 1) {
    return res.json({ status: 'Error: Busy' });
  }

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  // Get new data
  // req.body = { records: [ 'rec1', 'rec2', 'rec3' ] }
  const tracking = req.body.records;
  const records_to_add = [];

  let d = new Date();
  d = dateToString(d);

  // Prepare data to add
  for (let i = 0; i < tracking.length; i++) {
    let new_entry = true;
    if (tracking[i].indexOf('-') < 0 && tracking[i].length > 0) {
      if (tracking[i].indexOf('JP') < 0 && tracking[i].length == 12) {
        // Does not support domestic shipping
        new_entry = false;
      } else {
        for (let row_i = 0; row_i < rows_raw.length && new_entry; row_i++) {
          if (rows_raw[row_i].tracking == tracking[i]) {
            new_entry = false;
          }
        }
      }
    } else {
      // Can not track SAL Unregistered
      new_entry = false;
    }
    if (new_entry) {
      records_to_add.push({
        tracking: tracking[i],
        carrier: tracking[i].indexOf('JP') > 0 ? 'JP' : 'DHL',
        addeddate: d,
        delivered: '0'
      });
    }
  }

  // Start adding
  if (records_to_add.length > 0) {
    await sheet.addRows(records_to_add);
  }

  // Done!
  res.json({ status: 'OK' });
};

// GET get "delivered" or "not delivered" status
exports.api_get = async (req, res) => {
  const api_key = req.header('api-key');
  if (api_key == undefined) {
    return res.json({ status: 'Error: No API key' });
  }
  if (api_key != process.env.THIS_API_KEY) {
    return res.json({ status: 'Error: Invalid API key' });
  }

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  // tracking	delivereddate	delivered
  let outdata = { status: 'OK', records: [] };
  rows_raw.forEach(r => {
    outdata.records.push({
      tracking: r.tracking,
      delivereddate: r.delivereddate,
      delivered: r.delivered
    });
  });

  res.json(outdata);
};

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
