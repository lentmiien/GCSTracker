// Require used packages
const { GoogleSpreadsheet } = require('google-spreadsheet');
const getResults = require('../scraper');
const getResultsAPI = require('../tracker');

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

// Progress variables
let track_progress = -1;
let last_tracked = {
  date: '2020-01-01',
  count: 0
};

// Open a dashboard page
exports.mypage = async (req, res) => {
  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();
  const rows = rows_raw.filter(row => row.delivered == '0' && row.lastchecked.length > 0);

  let total = 0;
  let delivered = 0;
  let dhl_time = 0;
  let dhl_time_count = 0;
  let ems_time = 0;
  let ems_time_count = 0;
  let other_time = 0;
  let other_time_count = 0;
  rows_raw.forEach(data => {
    total++;
    if (data.delivered == '1') {
      delivered++;

      // Check delivery time
      const s_data = data.shippeddate.split('-');
      const sdate = new Date(parseInt(s_data[0]), parseInt(s_data[1]), parseInt(s_data[2]));
      const d_data = data.delivereddate.split('-');
      const ddate = new Date(parseInt(d_data[0]), parseInt(d_data[1]), parseInt(d_data[2]));
      const days = Math.round((ddate.getTime() - sdate.getTime()) / 86400000);

      if (data.carrier == 'DHL') {
        dhl_time += days;
        dhl_time_count++;
      } else if (data.tracking.indexOf('EM') == 0) {
        ems_time += days;
        ems_time_count++;
      } else {
        other_time += days;
        other_time_count++;
      }
    }
  });
  dhl_time = Math.round(100 * (dhl_time / dhl_time_count)) / 100;
  ems_time = Math.round(100 * (ems_time / ems_time_count)) / 100;
  other_time = Math.round(100 * (other_time / other_time_count)) / 100;

  // Render dashboard page with data
  res.render('dashboard', { rows, total, delivered, dhl_time, ems_time, other_time });
};

exports.delivered = async (req, res) => {
  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();
  const rows = rows_raw.filter(row => row.delivered == '1');

  // Render dashboard page with data
  res.render('delivered', { rows });
};

// Tracker variables
let JP_timer = 0;
let DHL_timer = 0;
const JP_scraping_counter = {
  current_date: '2020-01-01',
  count: 0,
  html: {
    status: 200,
    text: 'OK'
  }
};
const DHL_scraping_counter = {
  current_date: '2020-01-01',
  count: 0,
  html: {
    status: 500,
    text: 'Disabled'
  }
};
const DHL_API_counter = {
  current_date: '2020-01-01',
  count: 0,
  html: {
    status: 200,
    text: 'OK'
  }
};
let counter = 0;

async function TrackAll() {
  // Reset track progress
  track_progress = 0;

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();
  const rows = rows_raw.filter(row => row.delivered == '0');

  // Today date
  const td = new Date();
  let d = dateToString(td);

  // Reset counters every day
  if (d != JP_scraping_counter.current_date) {
    JP_scraping_counter.current_date = d;
    JP_scraping_counter.count = 0;
  }
  if (d != DHL_scraping_counter.current_date) {
    DHL_scraping_counter.current_date = d;
    DHL_scraping_counter.count = 0;
  }
  if (d != DHL_API_counter.current_date) {
    DHL_API_counter.current_date = d;
    DHL_API_counter.count = 0;
  }

  // DHL checks, first check after 3 days, then check every day
  let dhlfc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 3));
  let dhlnc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 1));

  // EMS checks, first check after 5 days, then check every 2nd day
  let emsfc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 5));
  let emsnc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 2));

  // Other checks, first check after 21 days, then check every 4th day
  let ofc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 21));
  let onc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 4));

  // Start tracking
  let updated_records = 0;
  let current_status = 200;
  for (let i = 0; i < rows.length; i++) {
    if (
      (rows[i].carrier == 'DHL' && rows[i].addeddate <= dhlfc && rows[i].lastchecked <= dhlnc) ||
      (rows[i].tracking.indexOf('EM') == 0 && rows[i].addeddate <= emsfc && rows[i].lastchecked <= emsnc) ||
      (rows[i].addeddate <= ofc && rows[i].lastchecked <= onc)
    ) {
      // check tracking
      let result;
      if (rows[i].carrier == 'JP') {
        if (JP_scraping_counter.html.status == 200) {
          // Delay if previous request to close
          const timer_check = Date.now() - JP_timer;
          if (timer_check < 1100) {
            await sleep(1100 - timer_check);
          }

          const url = `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${rows[i].tracking}&searchKind=S002&locale=ja`;
          result = await getResults(url, rows[i].carrier);
          JP_scraping_counter.count++;
          JP_scraping_counter.html.status = result.HTML_status;
          JP_scraping_counter.html.text = result.HTML_statusText;
        }
        current_status = JP_scraping_counter.html.status;

        JP_timer = Date.now();
      } else {
        // Delay if previous request to close
        const timer_check = Date.now() - DHL_timer;
        if (timer_check < 1100) {
          await sleep(1100 - timer_check);
        }

        if (DHL_API_counter.count < 250 && DHL_API_counter.html.status == 200) {
          // Use DHL API
          const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${rows[i].tracking}&service=express&requesterCountryCode=JP&originCountryCode=JP&language=en`;
          result = await getResultsAPI(url, rows[i].carrier);
          DHL_API_counter.count++;
          DHL_API_counter.html.status = result.HTML_status;
          DHL_API_counter.html.text = result.HTML_statusText;
          current_status = DHL_API_counter.html.status;
        } else if (DHL_scraping_counter.html.status == 200) {
          // Use DHL scraping
          const url = `dummy_url?tracking=${rows[i].tracking}`;
          result = await getResults(url, rows[i].carrier);
          DHL_scraping_counter.count++;
          DHL_scraping_counter.html.status = result.HTML_status;
          DHL_scraping_counter.html.text = result.HTML_statusText;
          current_status = DHL_scraping_counter.html.status;
        } else {
          current_status = 404;
        }

        DHL_timer = Date.now();
      }

      // Update entry if successful
      if (current_status == 200) {
        rows[i].country = result.country;
        rows[i].lastchecked = d;
        rows[i].status = result.status;
        rows[i].shippeddate = result.shippeddate;
        rows[i].delivereddate = result.delivered;
        rows[i].delivered = result.delivered.length > 0 ? '1' : '0';
        rows[i].data = result.rawdata;
        rows[i].save();
        updated_records++;
      }
    }

    // Update progress
    track_progress = (i + 1) / rows.length;
  }

  console.log(`#${counter} tracking done! (${updated_records} updated records)`);
  const time_now = new Date();
  last_tracked.date = `${d} ${time_now.getHours()}:${time_now.getMinutes()}`;
  last_tracked.count = updated_records;
}

// Automate tracker
async function Automation() {
  counter++;

  // Do not start tracking if currently tracking
  if (track_progress >= 0 && track_progress < 1) {
    console.log(`Skip#${counter}, due to currently tracking...`);
    // Try again after an hour
    setTimeout(Automation, 3600000);
    return;
  }

  // Start tracking
  await TrackAll();

  // Repeat once every day at 1:00 in the morning
  const td = new Date();
  const next_auto = new Date(td.getFullYear(), td.getMonth(), td.getDate() + 1, 1, 0, 0);
  setTimeout(Automation, next_auto.getTime() - Date.now());
}
Automation();

// Track (Scrap/API) start route (redirect to dashboard)
exports.track = async (req, res) => {
  counter++;

  // Do not start tracking if currently tracking
  if (track_progress >= 0 && track_progress < 1) {
    console.log(`Skip#${counter}, due to currently tracking...`);
    return res.redirect('/mypage');
  }

  // Reset track progress
  //track_progress = 0;

  // Redirect to dashboard
  res.redirect('/mypage');

  // Start tracking
  await TrackAll();

  // // Load data from google-spredsheet
  // const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  // await doc.useServiceAccountAuth(creds);
  // await doc.loadInfo();
  // const sheet = doc.sheetsByIndex[0];

  // const rows_raw = await sheet.getRows();
  // const rows = rows_raw.filter(row => row.delivered == '0');

  // // Today date
  // const td = new Date();
  // let d = dateToString(td);

  // // Reset counters every day
  // if (d != JP_scraping_counter.current_date) {
  //   JP_scraping_counter.current_date = d;
  //   JP_scraping_counter.count = 0;
  // }
  // if (d != DHL_scraping_counter.current_date) {
  //   DHL_scraping_counter.current_date = d;
  //   DHL_scraping_counter.count = 0;
  // }
  // if (d != DHL_API_counter.current_date) {
  //   DHL_API_counter.current_date = d;
  //   DHL_API_counter.count = 0;
  // }

  // // DHL checks, first check after 3 days, then check every day
  // let dhlfc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 3));
  // let dhlnc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 1));

  // // EMS checks, first check after 5 days, then check every 2nd day
  // let emsfc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 5));
  // let emsnc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 2));

  // // Other checks, first check after 21 days, then check every 4th day
  // let ofc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 21));
  // let onc = dateToString(new Date(td.getFullYear(), td.getMonth(), td.getDate() - 4));

  // // Start tracking
  // let updated_records = 0;
  // for (let i = 0; i < rows.length; i++) {
  //   if (
  //     (rows[i].carrier == 'DHL' && rows[i].addeddate <= dhlfc && rows[i].lastchecked <= dhlnc) ||
  //     (rows[i].tracking.indexOf('EM') == 0 && rows[i].addeddate <= emsfc && rows[i].lastchecked <= emsnc) ||
  //     (rows[i].addeddate <= ofc && rows[i].lastchecked <= onc)
  //   ) {
  //     // check tracking
  //     let result;
  //     if (rows[i].carrier == 'JP') {
  //       // Delay if previous request to close
  //       const timer_check = Date.now() - JP_timer;
  //       if (timer_check < 1100) {
  //         await sleep(1100 - timer_check);
  //       }

  //       const url = `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${rows[i].tracking}&searchKind=S002&locale=ja`;
  //       result = await getResults(url, rows[i].carrier);
  //       JP_scraping_counter.count++;

  //       JP_timer = Date.now();
  //     } else {
  //       // Delay if previous request to close
  //       const timer_check = Date.now() - DHL_timer;
  //       if (timer_check < 1100) {
  //         await sleep(1100 - timer_check);
  //       }

  //       if (DHL_API_counter.count < 250) {
  //         // Use DHL API
  //         const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${rows[i].tracking}&service=express&requesterCountryCode=JP&originCountryCode=JP&language=en`;
  //         result = await getResultsAPI(url, rows[i].carrier);
  //         DHL_API_counter.count++;
  //       } else {
  //         // Use DHL scraping
  //         const url = `dummy_url?tracking=${rows[i].tracking}`;
  //         result = await getResults(url, rows[i].carrier);
  //         DHL_scraping_counter.count++;
  //       }

  //       DHL_timer = Date.now();
  //     }

  //     // Update entry
  //     rows[i].country = result.country;
  //     rows[i].lastchecked = d;
  //     rows[i].status = result.status;
  //     rows[i].shippeddate = result.shippeddate;
  //     rows[i].delivereddate = result.delivered;
  //     rows[i].delivered = result.delivered.length > 0 ? '1' : '0';
  //     rows[i].data = result.rawdata;
  //     rows[i].save();
  //     updated_records++;
  //   }

  //   // Update progress
  //   track_progress = (i + 1) / rows.length;
  // }

  // console.log(`Manual#${counter}, tracking done! (${updated_records} updated records)`);
  // const time_now = new Date();
  // last_tracked.date = `${d} ${time_now.getHours()}:${time_now.getMinutes()} M`;
  // last_tracked.count = updated_records;
};

// Tracking details page
exports.details = async (req, res) => {
  const tracking_id = req.params.id;

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();
  const rows = rows_raw.filter(row => row.tracking == tracking_id);

  const tracking_raw = JSON.parse(rows[0].data);

  res.render('tracking', { id: tracking_id, tracking: tracking_raw.shipments[0].events });
};

// Get progress route (return JSON)
exports.progress = (req, res) => {
  res.json({ track_progress, last_tracked, JP_scraping_counter, DHL_scraping_counter, DHL_API_counter });
};

// Download CSV file
exports.csv = async (req, res) => {
  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  // tracking	carrier	country	addeddate	lastchecked	status	shippeddate	delivereddate	delivered	data
  let outdata = `Tracking,Carrier,Country,Added date,Last checked,Status,Shipped date,Delivered date,Delivered`;
  rows_raw.forEach(r => {
    if (r.lastchecked.length > 0) {
      outdata += `\n${r.tracking},${r.carrier},"${r.country}",${r.addeddate},${r.lastchecked},"${r.status}",${r.shippeddate},${r.delivereddate},${r.delivered}`;
    }
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="' + 'tracking-data-' + Date.now() + '.csv"');
  res.send(outdata);
};

// Remove records delivered more than 14 days ago
exports.clear = async (req, res) => {
  // Do not start clearing if currently tracking
  if (track_progress >= 0 && track_progress < 1) {
    return res.redirect('/mypage');
  }

  // Load data from google-spredsheet
  const doc = new GoogleSpreadsheet(process.env.GSHEET_DOC_ID);
  await doc.useServiceAccountAuth(creds);
  await doc.loadInfo();
  const sheet = doc.sheetsByIndex[0];

  const rows_raw = await sheet.getRows();

  const rows = rows_raw.filter(r => r.delivered == '1');

  let d = new Date();
  d = new Date(d.getFullYear(), d.getMonth(), d.getDate() - 14);
  d = dateToString(d);

  // tracking	carrier	country	addeddate	lastchecked	status	shippeddate	delivereddate	delivered	data
  let outdata = `Tracking,Carrier,Country,Added date,Last checked,Status,Shipped date,Delivered date,Delivered,Data`;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i].delivereddate < d) {
      outdata += `\n${rows[i].tracking},${rows[i].carrier},"${rows[i].country}",${rows[i].addeddate},${rows[i].lastchecked},"${
        rows[i].status
      }",${rows[i].shippeddate},${rows[i].delivereddate},${rows[i].delivered},"${rows[i].data.split('"').join("'")}"`;
      rows[i].delete();
    }
  }

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="' + 'deleted-data-' + Date.now() + '.csv"');
  res.send(outdata);
};

// Helper function
function sleep(time) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, time);
  });
}

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
