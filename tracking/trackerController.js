// Require used packages
const getResults = require('./scraper');
const getResultsAPI = require('./tracker');

// Require necessary database models
const async = require('async');
const { Tracking, Op } = require('../sequelize');

// Runtime logger
const { SetStatus, Log, GetLog } = require('../runlog');

/*******************
 *
 *  MAGIC NUMBERS
 *
 *******************/
const DHL_API_MAX_REQUESTS = 2500;
const HTTP_OK_CODE = 200;
const AUTO_RETRY = 3600000;
const AUTO_SCHEDULE = 16;
const DEFAULT_DATE = '2020-01-01';
const JP_MIN_DELAY_TIME = 1100;
const DHL_MIN_DELAY_TIME = 1100;
const USPS_MIN_DELAY_TIME = 150;
const limit_date = new Date(2020, 0, 2, 12, 0, 0); // Just after 2020-01-01 12:00

//---------------------------------------------//
// exports.endpoints = (req, res, next) => {}; //
//---------------------------------------------//

// Progress variables
let last_tracked = {
  date: DEFAULT_DATE,
  count: 0,
};

// Tracker variables
const JP_scraping_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  nowtracking: '',
  html: {
    status: HTTP_OK_CODE,
    text: 'OK',
  },
};
const DHL_scraping_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  nowtracking: '',
  html: {
    status: HTTP_OK_CODE,
    text: 'OK',
  },
};
const DHL_API_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  nowtracking: '',
  html: {
    status: HTTP_OK_CODE,
    text: 'OK',
  },
};
const USPS_API_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  nowtracking: '',
  html: {
    status: HTTP_OK_CODE,
    text: 'OK',
  },
};
let counter = 0;

async function TrackAll() {
  // Today date
  const td = new Date();
  let d = dateToString(td);
  last_tracked.count = 0;

  // Reset counters every day
  if (d != JP_scraping_counter.current_date) {
    JP_scraping_counter.current_date = d;
    JP_scraping_counter.count = 0;
  }
  if (d != DHL_scraping_counter.current_date) {
    DHL_scraping_counter.current_date = d;
    DHL_scraping_counter.count = 0;
  }
  if (d != USPS_API_counter.current_date) {
    USPS_API_counter.current_date = d;
    USPS_API_counter.count = 0;
  }
  if (d != DHL_API_counter.current_date) {
    DHL_API_counter.current_date = d;
    DHL_API_counter.count = 0;
  }

  // Reset status codes every run
  JP_scraping_counter.html.status = HTTP_OK_CODE;
  DHL_scraping_counter.html.status = HTTP_OK_CODE;
  DHL_API_counter.html.status = HTTP_OK_CODE;
  USPS_API_counter.html.status = HTTP_OK_CODE;

  // DHL checks, first check after 4 days, then check every 2nd day (1 day = 86400000 ms)
  let dhlfc = DaysAgo(5);
  let dhlnc = DaysAgo(3);

  // Postal checks, first check after 7 days, then check every 3rd day
  let postalfc = DaysAgo(7);
  let postalnc = DaysAgo(3);

  // Stop all tracking after 90 days
  const cutoff = DaysAgo(90);
  const cutoffjp = DaysAgo(135);
  const cutoffdhl = DaysAgo(60);

  async.parallel(
    {
      tracking_jp: function (callback) {
        Tracking.findAll({
          where: {
            carrier: 'JP',
            delivered: false,
            shippeddate: {
              [Op.gte]: cutoffjp,
            },
            addeddate: {
              [Op.lte]: postalfc,
            },
            lastchecked: {
              [Op.lte]: postalnc,
            },
          },
        }).then((entry) => callback(null, entry));
      },
      tracking_usps: function (callback) {
        Tracking.findAll({
          where: {
            carrier: 'USPS',
            delivered: false,
            shippeddate: {
              [Op.gte]: cutoff,
            },
            lastchecked: {
              [Op.lte]: dhlnc,
            },
          },
        }).then((entry) => callback(null, entry));
      },
      tracking_dhl: function (callback) {
        Tracking.findAll({
          where: {
            carrier: 'DHL',
            delivered: false,
            shippeddate: {
              [Op.gte]: cutoffdhl,
            },
            addeddate: {
              [Op.lte]: dhlfc,
            },
            lastchecked: {
              [Op.lte]: dhlnc,
            },
          },
          order: [['lastchecked', 'ASC']],
        }).then((entry) => callback(null, entry));
      },
    },
    function (err, results) {
      if (err) {
        console.error(`---${new Date()}---[TrackAll]\n${err}`);
        return next(err);
      }
      Log(
        'Start tracking',
        JSON.stringify(
          { records: { JP: results.tracking_jp.length, USPS: results.tracking_usps.length, DHL: results.tracking_dhl.length } },
          null,
          2
        )
      );
      // Successful, so start tracking
      async.parallel(
        {
          jp_status_code: async function (callback) {
            JP_tracker(results.tracking_jp);
            callback(null, 'OK');
          },
          usps_status_code: async function (callback) {
            USPS_tracker(results.tracking_usps);
            callback(null, 'OK');
          },
          dhl_status_code: function (callback) {
            DHL_tracker(results.tracking_dhl);
            callback(null, 'OK');
          },
        },
        function (err, results2) {
          const time_now = new Date();
          last_tracked.date = `${d} ${time_now.getHours()}:${time_now.getMinutes()}`;
        }
      );
    }
  );
}

// JP tracking function
let JP_timer = 0;
async function JP_tracker(tracking) {
  const total = tracking.length;

  // Loop through tracking
  for (let i = 0; i < total; i++) {
    const item = tracking[i];
    JP_scraping_counter.nowtracking = item.tracking;

    // Delay if previous request to close
    const timer_check = Date.now() - JP_timer;
    if (timer_check < JP_MIN_DELAY_TIME) {
      await sleep(JP_MIN_DELAY_TIME - timer_check);
    }

    // Ready to start tracking
    if (JP_scraping_counter.html.status == HTTP_OK_CODE) {
      // Scraping is enabled and good for use
      JP_scraping_counter.count++; // About to do an API request so increase counter
      const url = `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${item.tracking}&searchKind=S002&locale=en`;
      const result = await getResults(url, item.carrier);
      JP_timer = Date.now();

      // Update tracking progress if there was any errors
      if (result.HTML_status != 200) {
        Log('Failed tracking', `[JP_scraping] Tracking number "${item.tracking}" returned:\n${JSON.stringify(result, null, 2)}`);
        JP_scraping_counter.html.status = result.HTML_status;
        JP_scraping_counter.html.text = result.HTML_statusText;
      } else {
        // Update entry if successful
        Tracking.update(
          {
            carrier: result.carrier ? result.carrier : item.carrier,
            country: result.country,
            lastchecked: Date.now(),
            status: result.status,
            shippeddate: result.shippeddate,
            delivereddate: result.delivered,
            delivered: result.delivered > limit_date.getTime() ? true : false,
            data: result.rawdata,
          },
          {
            where: { id: item.id },
          }
        );
        last_tracked.count++;
      }
    }
    // Update progress
    JP_scraping_counter.done = Math.round((10000 * (i + 1)) / total) / 100;
    SetStatus({ jp: { current: i + 1, total, last: item.tracking } });
  }
  JP_scraping_counter.nowtracking = '';
}

// USPS tracking function
let USPS_timer = 0;
async function USPS_tracker(tracking) {
  const total = tracking.length;

  // Loop through tracking
  for (let i = 0; i < total; i++) {
    const item = tracking[i];
    USPS_API_counter.nowtracking = item.tracking;

    // Delay if previous request to close
    const timer_check = Date.now() - USPS_timer;
    if (timer_check < USPS_MIN_DELAY_TIME) {
      await sleep(USPS_MIN_DELAY_TIME - timer_check);
    }

    // Ready to start tracking
    if (USPS_API_counter.html.status == HTTP_OK_CODE) {
      // API is enabled and good for use
      USPS_API_counter.count++; // About to do an API request so increase counter
      const url = `http://production.shippingapis.com/ShippingApi.dll?API=TrackV2&XML=<TrackRequest USERID="${process.env.USPS_API_KEY}"><TrackID ID="${item.tracking}"></TrackID></TrackRequest>`;
      const result = await getResultsAPI(url, item.carrier);
      USPS_timer = Date.now();

      // Update tracking progress if there was any errors
      if (result.HTML_status != 200) {
        Log('Failed tracking', `[USPS_API] Tracking number "${item.tracking}" returned:\n${JSON.stringify(result, null, 2)}`);
        // For "Tracking unavailable", just skip and continue (tracking was successful, just no data)
        if (result.HTML_status != 'Tracking unavailable') {
          USPS_API_counter.html.status = result.HTML_status;
          USPS_API_counter.html.text = result.HTML_statusText;
        }
      } else {
        // Update entry if successful
        const data_to_update = {
          lastchecked: Date.now(),
          status: result.status,
          delivered: false,
          data: result.rawdata,
        };
        if (result.shippeddate) {
          data_to_update['shippeddate'] = result.shippeddate;
        }
        if (result.delivered > Date.now() - 8640000000) {
          data_to_update['delivereddate'] = result.delivered;
          data_to_update['delivered'] = true;
        }
        Tracking.update(data_to_update, {
          where: { id: item.id },
        });
        last_tracked.count++;
      }
    }
    // Update progress
    USPS_API_counter.done = Math.round((10000 * (i + 1)) / total) / 100;
    SetStatus({ usps: { current: i + 1, total, last: item.tracking } });
  }
  USPS_API_counter.nowtracking = '';
}

// DHL tracking function
let DHL_timer = 0;
async function DHL_tracker(tracking) {
  const total = tracking.length;

  // Loop through tracking
  for (let i = 0; i < total; i++) {
    const item = tracking[i];
    DHL_API_counter.nowtracking = item.tracking;
    DHL_scraping_counter.nowtracking = item.tracking;

    // Delay if previous request to close
    const timer_check = Date.now() - DHL_timer;
    if (timer_check < DHL_MIN_DELAY_TIME) {
      await sleep(DHL_MIN_DELAY_TIME - timer_check);
    }

    // Ready to start tracking
    if (DHL_API_counter.count < DHL_API_MAX_REQUESTS && DHL_API_counter.html.status == HTTP_OK_CODE) {
      // API is enabled and good for use
      DHL_API_counter.count++; // About to do an API request so increase counter
      const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${item.tracking}&service=express&requesterCountryCode=JP&originCountryCode=JP&language=en`;
      const result = await getResultsAPI(url, item.carrier);
      DHL_timer = Date.now();

      // Update tracking progress if there was any errors
      if (result.HTML_status != 200) {
        Log('Failed tracking', `[DHL_API] Tracking number "${item.tracking}" returned:\n${JSON.stringify(result, null, 2)}`);
        DHL_API_counter.html.status = result.HTML_status;
        DHL_API_counter.html.text = result.HTML_statusText;
      } else {
        // Update entry if successful
        Tracking.update(
          {
            carrier: result.carrier ? result.carrier : item.carrier,
            country: result.country,
            lastchecked: Date.now(),
            status: result.status,
            shippeddate: result.shippeddate,
            delivereddate: result.delivered,
            delivered: result.delivered > limit_date.getTime() ? true : false,
            data: result.rawdata,
          },
          {
            where: { id: item.id },
          }
        );
        last_tracked.count++;
      }
    } else if (DHL_scraping_counter.html.status == HTTP_OK_CODE) {
      // If API is not available do web scraping instead
      DHL_scraping_counter.count++; // About to do a scraping request so update counter
      const url = `https://www.dhl.com/cgi-bin/tracking.pl?AWB=${item.tracking}`;
      const result = await getResults(url, item.carrier);
      DHL_timer = Date.now();

      // Update tracking progress if there was any errors
      if (result.HTML_status != 200) {
        Log('Failed tracking', `[DHL_scraping] Tracking number "${item.tracking}" returned:\n${JSON.stringify(result, null, 2)}`);
        DHL_scraping_counter.html.status = result.HTML_status;
        DHL_scraping_counter.html.text = result.HTML_statusText;
      } else {
        // Update entry if successful
        Tracking.update(
          {
            carrier: result.carrier ? result.carrier : item.carrier,
            country: result.country,
            lastchecked: Date.now(),
            status: result.status,
            shippeddate: result.shippeddate,
            delivereddate: result.delivered,
            delivered: result.delivered > limit_date.getTime() ? true : false,
            data: result.rawdata,
          },
          {
            where: { id: item.id },
          }
        );
        last_tracked.count++;
      }
    }
    // Update progress
    DHL_scraping_counter.done = Math.round((10000 * (i + 1)) / total) / 100;
    DHL_API_counter.done = DHL_scraping_counter.done;
    SetStatus({ dhl: { current: i + 1, total, last: item.tracking } });
  }
  DHL_API_counter.nowtracking = '';
  DHL_scraping_counter.nowtracking = '';
}

// Automate tracker
async function Automation() {
  counter++;

  // Check if previous tracking is done -> force tracking
  if (true) {
    //JP_scraping_counter.done == 100 && DHL_scraping_counter.done == 100 && USPS_API_counter.done == 100 && DHL_API_counter.done == 100) {
    // Start tracking
    await TrackAll();
    // Repeat once every day at scheduled time
    const td = new Date();
    const next_auto = new Date(td.getFullYear(), td.getMonth(), td.getDate() + 1, AUTO_SCHEDULE, 0, 0);
    setTimeout(Automation, next_auto.getTime() - Date.now());
  } else {
    // Do not track
    console.log(`Skip#${counter}, due to currently tracking...`);
    // Try again after an hour
    setTimeout(Automation, AUTO_RETRY);
  }
}
if (process.env.LOCAL == undefined) {
  Log('Automation', 'Starting atumatic tracking...');
  Automation();
} else {
  Log('Automation', 'No tracking in local mode!');
}

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

function DaysAgo(days) {
  return Date.now() - 86400000 * days;
}

function GetStatus(history) {}
