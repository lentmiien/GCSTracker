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
  const response = {};

  // If you are a logged in user, then no need to check API key
  if (res.locals.role != 'admin') {
    const api_key = req.header('api-key');
    if (api_key == undefined) {
      response['status'] = 'ERROR';
      response['message'] = 'No API key';
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      return res.json(response);
    }
  }

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  // Get new data
  // req.body = { records: [ 'rec1', 'rec2', 'rec3' ] }
  const tracking = req.body.records.sort();
  const records_to_add = [];

  let d = new Date();
  d = dateToString(d);

  // Prepare OK response
  response['status'] = 'OK';
  response['num_records'] = tracking.length;
  response['date'] = d;
  response['added_records'] = 0;
  response['sal_unreg_empty'] = 0;
  response['domestic'] = 0;
  response['duplicates'] = 0;
  response['existing'] = 0;
  response['need_check'] = [];

  // Prepare data to add
  let lastadded = '';
  for (let i = 0; i < tracking.length; i++) {
    let new_entry = true;
    if (tracking[i].indexOf('-') < 0 && tracking[i].length > 0) {
      if (tracking[i].indexOf('JP') < 0 && tracking[i].length == 12) {
        // Does not support domestic shipping
        new_entry = false;
        response['domestic']++;
      } else {
        if (tracking[i] == lastadded) {
          new_entry = false;
          response['duplicates']++;
          response['status'] = 'WARNING';
          response['message'] = 'Duplicate records exist';
          response['need_check'].push(tracking[i]);
        } else {
          for (let row_i = 0; row_i < rows_raw.length && new_entry; row_i++) {
            if (rows_raw[row_i].tracking == tracking[i]) {
              new_entry = false;
              response['existing']++;
              response['status'] = 'WARNING';
              response['message'] = 'Existing records exist';
              response['need_check'].push(tracking[i]);
            }
          }
        }
      }
    } else {
      // Can not track SAL Unregistered
      new_entry = false;
      response['sal_unreg_empty']++;
    }
    if (new_entry) {
      lastadded = tracking[i];
      records_to_add.push({
        tracking: tracking[i],
        carrier: tracking[i].indexOf('JP') > 0 ? 'JP' : 'DHL',
        addeddate: d,
        delivered: '0'
      });
      response['added_records']++;
    }
  }

  // Start adding
  if (records_to_add.length > 0) {
    await sheet.addRows(records_to_add);
  }

  // Done!
  res.json(response);
};

// GET get "delivered" or "not delivered" status
// /get/:startdate/:enddate
exports.api_get = async (req, res) => {
  const response = {};

  // If you are a logged in user, then no need to check API key
  if (res.locals.role != 'admin') {
    const api_key = req.header('api-key');
    if (api_key == undefined) {
      response['status'] = 'ERROR';
      response['message'] = 'No API key';
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      return res.json(response);
    }
  }

  // Verify dates
  const start = req.params.startdate;
  const end = req.params.enddate;
  if (start.indexOf('-') != 4 || end.indexOf('-') != 4 || start.length != 10 || end.length != 10) {
    response['status'] = 'ERROR';
    response['message'] = 'Invalid date range';
    return res.json(response);
  }

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  let d = new Date();
  d = dateToString(d);

  // Prepare OK response
  response['status'] = 'OK';
  response['date'] = d;
  response['records'] = [];

  // tracking	delivereddate	delivered
  rows_raw.forEach(r => {
    if (r.lastchecked >= start && r.lastchecked <= end) {
      response['records'].push({
        tracking: r.tracking,
        delivereddate: r.delivereddate,
        delivered: r.delivered
      });
    }
  });

  res.json(response);
};

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
