// Require used packages
const getResults = require('../scraper');
const getResultsAPI = require('../tracker');

// Require necessary database models
const async = require('async');
const { Tracking, Op } = require('../sequelize');

/*******************
 *
 *  MAGIC NUMBERS
 *
 *******************/
const DHL_API_MAX_REQUESTS = 250;
const HTTP_OK_CODE = 200;
const HTTP_DEFAULT_DISABLE_CODE = 555;
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
  count: 0
};

// Open dashboard page
exports.mypage = async (req, res, next) => {
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll().then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter(row => row.delivered == false && row.status != null);
      const delivered_rows = results.tracking.filter(row => row.delivered == true && row.delivereddate > Date.now() - 2592000000);

      let dhl_time = 0;
      let dhl_time_count = 0;
      let ems_time = 0;
      let ems_time_count = 0;
      let other_time = 0;
      let other_time_count = 0;
      delivered_rows.forEach(data => {
        // Check delivery time
        const days = Math.round((data.delivereddate - data.shippeddate) / 86400000); // Divide by 86400000 to get result in days
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
      });
      dhl_time = Math.round(100 * (dhl_time / dhl_time_count)) / 100;
      ems_time = Math.round(100 * (ems_time / ems_time_count)) / 100;
      other_time = Math.round(100 * (other_time / other_time_count)) / 100;

      const undelivered = {
        last7days: {
          limit: Date.now() - 604800000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0
        },
        last30days: {
          limit: Date.now() - 2592000000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0
        },
        last90days: {
          limit: Date.now() - 7776000000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0
        },
        all: {
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0
        },
        status_counter: []
      };
      rows.forEach(row => {
        undelivered.all.number_of_records++;
        if (row.shippeddate > undelivered.last7days.limit) {
          undelivered.last7days.number_of_records++;
        }
        if (row.shippeddate > undelivered.last30days.limit) {
          undelivered.last30days.number_of_records++;
        }
        if (row.shippeddate > undelivered.last90days.limit) {
          undelivered.last90days.number_of_records++;
        }
        if (row.carrier == 'DHL') {
          undelivered.all.dhl_records++;
          if (row.shippeddate > undelivered.last7days.limit) {
            undelivered.last7days.dhl_records++;
          }
          if (row.shippeddate > undelivered.last30days.limit) {
            undelivered.last30days.dhl_records++;
          }
          if (row.shippeddate > undelivered.last90days.limit) {
            undelivered.last90days.dhl_records++;
          }
        } else if (row.tracking.indexOf('EM') == 0) {
          undelivered.all.ems_records++;
          if (row.shippeddate > undelivered.last7days.limit) {
            undelivered.last7days.ems_records++;
          }
          if (row.shippeddate > undelivered.last30days.limit) {
            undelivered.last30days.ems_records++;
          }
          if (row.shippeddate > undelivered.last90days.limit) {
            undelivered.last90days.ems_records++;
          }
        } else {
          undelivered.all.other_records++;
          if (row.shippeddate > undelivered.last7days.limit) {
            undelivered.last7days.other_records++;
          }
          if (row.shippeddate > undelivered.last30days.limit) {
            undelivered.last30days.other_records++;
          }
          if (row.shippeddate > undelivered.last90days.limit) {
            undelivered.last90days.other_records++;
          }
        }
        let new_status = row.status ? true : false;
        for (let i = 0; i < undelivered.status_counter.length && new_status; i++) {
          if (undelivered.status_counter[i].status == row.status) {
            undelivered.status_counter[i].count++;
            new_status = false;
          }
        }
        if (new_status) {
          undelivered.status_counter.push({
            status: row.status,
            count: 1
          });
        }
      });

      undelivered.status_counter.sort((a, b) => {
        if (a.count > b.count) {
          return -1;
        } else if (a.count < b.count) {
          return 1;
        } else {
          return 0;
        }
      });

      res.render('dashboard', { rows, dhl_time, ems_time, other_time, undelivered });
    }
  );
};

// Show all undelivered packages
// /:carrier/:start/:end
exports.undelivered = async (req, res, next) => {
  const query = { order: [['shippeddate', 'ASC']] };
  if (req.params.carrier && req.params.start && req.params.end) {
    query['where'] = {};
    if (req.params.carrier == 'dhl') {
      query.where['carrier'] = 'DHL';
    } else if (req.params.carrier == 'ems') {
      query.where['tracking'] = {
        [Op.like]: 'EM%'
      };
    } else if (req.params.carrier == 'other') {
      query.where['carrier'] = {
        [Op.not]: 'DHL'
      };
      query.where['tracking'] = {
        [Op.notLike]: 'EM%'
      };
    }
    query.where['shippeddate'] = {
      [Op.gte]: parseInt(req.params.start),
      [Op.lt]: parseInt(req.params.end)
    };
  }
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll(query).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter(row => row.delivered == false && row.status != null);

      const analyze = {
        dhl_count: 0,
        ems_count: 0,
        other_count: 0
      };
      rows.forEach(entry => {
        if (entry.carrier == 'DHL') {
          analyze.dhl_count++;
        } else if (entry.tracking.indexOf('EM') == 0) {
          analyze.ems_count++;
        } else {
          analyze.other_count++;
        }
      });

      res.render('undelivered', { rows, analyze, filter: req.params });
    }
  );
};

// Show country delivery times
exports.undelivered_country = async (req, res, next) => {
  // TODO fix!!!
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll({
          order: [['country', 'ASC']]
        }).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter(row => row.delivered == false && row.status != null);

      const analyze = {
        overall: {
          all_dhl_count: 0,
          all_ems_count: 0,
          all_other_count: 0
        },
        countries: []
      };

      rows.forEach(entry => {
        let new_entry = true;
        for (let i = 0; i < analyze.countries.length && new_entry; i++) {
          if (entry.country == analyze.countries[i].country) {
            new_entry = false;
            if (entry.carrier == 'DHL') {
              analyze.countries[i].dhl_count++;
              analyze.overall.all_dhl_count++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze.countries[i].ems_count++;
              analyze.overall.all_ems_count++;
            } else {
              analyze.countries[i].other_count++;
              analyze.overall.all_other_count++;
            }
          }
        }
        if (new_entry) {
          new_entry = analyze.countries.length;
          analyze.countries.push({
            country: entry.country,
            dhl_count: 0,
            ems_count: 0,
            other_count: 0
          });

          if (entry.carrier == 'DHL') {
            analyze.countries[new_entry].dhl_count++;
            analyze.overall.all_dhl_count++;
          } else if (entry.tracking.indexOf('EM') == 0) {
            analyze.countries[new_entry].ems_count++;
            analyze.overall.all_ems_count++;
          } else {
            analyze.countries[new_entry].other_count++;
            analyze.overall.all_other_count++;
          }
        }
      });

      res.render('undelivered_country', { analyze });
    }
  );
};

// Show country undelivery times
exports.ucountry = async (req, res, next) => {
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll({
          where: {
            country: req.params.country
          }
        }).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }

      const time = Date.now();
      const d = new Date();
      const analyze = [
        {
          label: '全体',
          start: 0,
          end: time,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
          current_shipping_times: { dhl: [], dhl_ems: [], all: [] }
        },
        {
          label: '7日以内',
          start: time - 604800000,
          end: time,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '8日～30日',
          start: time - 2592000000,
          end: time - 604800000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '31日～90日',
          start: time - 7776000000,
          end: time - 2592000000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '91日以上',
          start: 0,
          end: time - 7776000000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '今月',
          start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '先月',
          start: new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        },
        {
          label: '先々月',
          start: new Date(d.getFullYear(), d.getMonth() - 2, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() - 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 }
        }
      ];
      results.tracking.forEach(entry => {
        if (entry.delivered == false) {
          const tdays = Math.round((time - entry.shippeddate) / 86400000);
          if (entry.carrier == 'DHL') {
            analyze[0].current_shipping_times.dhl.push(tdays);
            analyze[0].current_shipping_times.dhl_ems.push(tdays);
            analyze[0].current_shipping_times.all.push(tdays);
          } else if (entry.tracking.indexOf('EM') == 0) {
            analyze[0].current_shipping_times.dhl_ems.push(tdays);
            analyze[0].current_shipping_times.all.push(tdays);
          } else {
            analyze[0].current_shipping_times.all.push(tdays);
          }
        }
        for (let i = 0; i < analyze.length; i++) {
          if (entry.shippeddate >= analyze[i].start && entry.shippeddate < analyze[i].end) {
            if (entry.carrier == 'DHL') {
              analyze[i].dhl_count.all++;
              if (entry.delivered == false) {
                analyze[i].dhl_count.notdone++;
              }
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[i].ems_count.all++;
              if (entry.delivered == false) {
                analyze[i].ems_count.notdone++;
              }
            } else {
              analyze[i].other_count.all++;
              if (entry.delivered == false) {
                analyze[i].other_count.notdone++;
              }
            }
          }
        }
      });

      res.render('ucountry', { analyze, country: req.params.country });
    }
  );
};

// Show all delivered packages
exports.delivered = async (req, res, next) => {
  const one_week = Date.now() - 604800000;
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll({
          order: [['delivereddate', 'DESC']],
          where: {
            delivereddate: {
              [Op.gte]: one_week
            }
          }
        }).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter(row => row.delivered == true && row.delivereddate > 0);

      const analyze = {
        dhl_count: 0,
        ems_count: 0,
        other_count: 0
      };
      rows.forEach(entry => {
        if (entry.carrier == 'DHL') {
          analyze.dhl_count++;
        } else if (entry.tracking.indexOf('EM') == 0) {
          analyze.ems_count++;
        } else {
          analyze.other_count++;
        }
      });

      res.render('delivered', { rows, analyze });
    }
  );
};

// Show country delivery times
exports.delivered_country = async (req, res, next) => {
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll({
          order: [['country', 'ASC']]
        }).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter(row => row.delivered == true && row.delivereddate > 0);

      res.render('delivered_country', { rows });
    }
  );
};

// Show country delivery times
exports.country = async (req, res, next) => {
  async.parallel(
    {
      tracking: callback => {
        Tracking.findAll({
          where: {
            country: req.params.country
          }
        }).then(entry => callback(null, entry));
      }
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      // const rows = results.tracking.filter(row => row.dataValues.delivered == true);
      // const undelivered = results.tracking.filter(row => row.dataValues.delivered == false);

      const time = Date.now();
      const d = new Date();
      const analyze = [
        {
          label: '全体',
          start: 0,
          end: time,
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 },
          delivery_times: { dhl: [], dhl_ems: [], all: [] }
        },
        {
          label: '7日以内',
          start: time - 604800000,
          end: time,
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '8日～30日',
          start: time - 2592000000,
          end: time - 604800000,
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '31日～90日',
          start: time - 7776000000,
          end: time - 2592000000,
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '91日以上',
          start: 0,
          end: time - 7776000000,
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '今月',
          start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '先月',
          start: new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        },
        {
          label: '先々月',
          start: new Date(d.getFullYear(), d.getMonth() - 2, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() - 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0 },
          ems_count: { all: 0, done: 0, days: 0 },
          other_count: { all: 0, done: 0, days: 0 }
        }
      ];
      results.tracking.forEach(entry => {
        let days = 0;
        if (entry.delivered == true && entry.delivereddate > 1) {
          days = Math.round((entry.delivereddate - entry.shippeddate) / 86400000);
          if (entry.carrier == 'DHL') {
            analyze[0].delivery_times.dhl.push(days);
            analyze[0].delivery_times.dhl_ems.push(days);
            analyze[0].delivery_times.all.push(days);
          } else if (entry.tracking.indexOf('EM') == 0) {
            analyze[0].delivery_times.dhl_ems.push(days);
            analyze[0].delivery_times.all.push(days);
          } else {
            analyze[0].delivery_times.all.push(days);
          }
        }
        for (let i = 0; i < analyze.length; i++) {
          if (entry.shippeddate >= analyze[i].start && entry.shippeddate < analyze[i].end) {
            if (entry.carrier == 'DHL') {
              analyze[i].dhl_count.all++;
              if (entry.delivered == true && entry.delivereddate > 0) {
                analyze[i].dhl_count.done++;
                analyze[i].dhl_count.days += days;
              }
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[i].ems_count.all++;
              if (entry.delivered == true && entry.delivereddate > 0) {
                analyze[i].ems_count.done++;
                analyze[i].ems_count.days += days;
              }
            } else {
              analyze[i].other_count.all++;
              if (entry.delivered == true && entry.delivereddate > 0) {
                analyze[i].other_count.done++;
                analyze[i].other_count.days += days;
              }
            }
          }
        }
      });

      res.render('country', { analyze, country: req.params.country });
    }
  );
};

// Tracker variables
let JP_timer = 0;
let DHL_timer = 0;
let USPS_timer = 0;
const JP_scraping_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  html: {
    status: HTTP_OK_CODE,
    text: 'OK'
  }
};
const DHL_scraping_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  html: {
    status: HTTP_OK_CODE,
    text: 'OK'
  }
};
const DHL_API_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  html: {
    status: HTTP_OK_CODE,
    text: 'OK'
  }
};
const USPS_API_counter = {
  current_date: DEFAULT_DATE,
  count: 0,
  done: 100,
  html: {
    status: HTTP_OK_CODE,
    text: 'OK'
  }
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

  // DHL checks, first check after 3 days, then check every day (1 day = 86400000 ms)
  let dhlfc = td.getTime() - 3 * 86400000;
  let dhlnc = td.getTime() - 1 * 86400000;

  // EMS checks, first check after 5 days, then check every 2nd day
  let emsfc = td.getTime() - 5 * 86400000;
  let emsnc = td.getTime() - 2 * 86400000;

  // Other checks, first check after 21 days, then check every 4th day
  let ofc = td.getTime() - 21 * 86400000;
  let onc = td.getTime() - 4 * 86400000;

  async.parallel(
    {
      tracking_jp: function(callback) {
        Tracking.findAll({
          where: {
            carrier: 'JP',
            delivered: false
          }
        }).then(entry => callback(null, entry));
      },
      tracking_usps: function(callback) {
        Tracking.findAll({
          where: {
            carrier: 'USPS',
            delivered: false
          }
        }).then(entry => callback(null, entry));
      },
      tracking_dhl: function(callback) {
        Tracking.findAll({
          where: {
            carrier: 'DHL',
            delivered: false
          }
        }).then(entry => callback(null, entry));
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      // Successful, so start tracking
      let updated_records = 0;

      async.parallel(
        {
          jp_status_code: async function(callback) {
            // Loop through results.tracking_jp
            for (let i = 0; i < results.tracking_jp.length; i++) {
              JP_scraping_counter.done = Math.round((10000 * (i + 1)) / results.tracking_jp.length) / 100;
              if (
                (results.tracking_jp[i].tracking.indexOf('EM') == 0 &&
                  results.tracking_jp[i].addeddate <= emsfc &&
                  results.tracking_jp[i].lastchecked <= emsnc) ||
                (results.tracking_jp[i].addeddate <= ofc && results.tracking_jp[i].lastchecked <= onc)
              ) {
                let result;
                // Delay if previous request to close
                const request_time = Date.now();
                const timer_check = request_time - JP_timer;
                if (timer_check < JP_MIN_DELAY_TIME) {
                  await sleep(JP_MIN_DELAY_TIME - timer_check);
                }
                // Track
                if (JP_scraping_counter.html.status == HTTP_OK_CODE) {
                  const url = `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${results.tracking_jp[i].tracking}&searchKind=S002&locale=ja`;
                  result = await getResults(url, results.tracking_jp[i].carrier);
                  JP_scraping_counter.count++;
                  JP_scraping_counter.html.status = result.HTML_status;
                  JP_scraping_counter.html.text = result.HTML_statusText;
                  JP_timer = Date.now();
                }
                // Update entry if successful
                if (JP_scraping_counter.html.status == HTTP_OK_CODE) {
                  Tracking.update(
                    {
                      carrier: result.carrier ? result.carrier : results.tracking_jp[i].carrier,
                      country: result.country,
                      lastchecked: Date.now(),
                      status: result.status,
                      shippeddate: result.shippeddate,
                      delivereddate: result.delivered,
                      delivered: result.delivered > limit_date.getTime() ? true : false,
                      data: result.rawdata
                    },
                    {
                      where: { id: results.tracking_jp[i].id }
                    }
                  );
                  last_tracked.count++;
                }
              }
            }
            callback(null, 'OK');
          },
          usps_status_code: async function(callback) {
            // Loop through results.tracking_usps
            for (let i = 0; i < results.tracking_usps.length; i++) {
              USPS_API_counter.done = Math.round((10000 * (i + 1)) / results.tracking_usps.length) / 100;
              if (results.tracking_usps[i].lastchecked <= emsnc) {
                let result;
                // Delay if previous request to close
                const request_time = Date.now();
                const timer_check = request_time - USPS_timer;
                if (timer_check < USPS_MIN_DELAY_TIME) {
                  await sleep(USPS_MIN_DELAY_TIME - timer_check);
                }
                // Track
                if (USPS_API_counter.html.status == HTTP_OK_CODE) {
                  const url = `http://production.shippingapis.com/ShippingApi.dll?API=TrackV2&XML=<TrackRequest USERID="${process.env.USPS_API_KEY}"><TrackID ID="${results.tracking_usps[i].tracking}"></TrackID></TrackRequest>`;
                  result = await getResultsAPI(url, results.tracking_usps[i].carrier);
                  USPS_API_counter.count++;
                  USPS_API_counter.html.status = result.HTML_status;
                  USPS_API_counter.html.text = result.HTML_statusText;
                  USPS_timer = Date.now();
                }
                // Update entry if successful
                if (USPS_API_counter.html.status == HTTP_OK_CODE) {
                  Tracking.update(
                    {
                      carrier: result.carrier ? result.carrier : results.tracking_usps[i].carrier,
                      country: result.country,
                      lastchecked: Date.now(),
                      status: result.status,
                      shippeddate: result.shippeddate,
                      delivereddate: result.delivered,
                      delivered: result.delivered > limit_date.getTime() ? true : false,
                      data: result.rawdata
                    },
                    {
                      where: { id: results.tracking_usps[i].id }
                    }
                  );
                  last_tracked.count++;
                }
              }
            }
            callback(null, 'OK');
          },
          dhl_status_code: async function(callback) {
            // Loop through results.tracking_dhl
            for (let i = 0; i < results.tracking_dhl.length; i++) {
              DHL_scraping_counter.done = Math.round((10000 * (i + 1)) / results.tracking_dhl.length) / 100;
              DHL_API_counter.done = DHL_scraping_counter.done;
              if (results.tracking_dhl[i].addeddate <= dhlfc && results.tracking_dhl[i].lastchecked <= dhlnc) {
                let result;
                // Delay if previous request to close
                const request_time = Date.now();
                const timer_check = request_time - DHL_timer;
                if (timer_check < DHL_MIN_DELAY_TIME) {
                  await sleep(DHL_MIN_DELAY_TIME - timer_check);
                }
                // Track
                let current_status = HTTP_OK_CODE;
                if (DHL_API_counter.count < DHL_API_MAX_REQUESTS && DHL_API_counter.html.status == HTTP_OK_CODE) {
                  // Use DHL API
                  const url = `https://api-eu.dhl.com/track/shipments?trackingNumber=${results.tracking_dhl[i].tracking}&service=express&requesterCountryCode=JP&originCountryCode=JP&language=en`;
                  result = await getResultsAPI(url, results.tracking_dhl[i].carrier);
                  DHL_API_counter.count++;
                  DHL_API_counter.html.status = result.HTML_status;
                  DHL_API_counter.html.text = result.HTML_statusText;
                  current_status = DHL_API_counter.html.status;
                  DHL_timer = Date.now();
                } else if (DHL_scraping_counter.html.status == HTTP_OK_CODE) {
                  // Use DHL scraping
                  const url = `https://www.dhl.com/cgi-bin/tracking.pl?AWB=${results.tracking_dhl[i].tracking}`;
                  result = await getResults(url, results.tracking_dhl[i].carrier);
                  DHL_scraping_counter.count++;
                  DHL_scraping_counter.html.status = result.HTML_status;
                  DHL_scraping_counter.html.text = result.HTML_statusText;
                  current_status = DHL_scraping_counter.html.status;
                  DHL_timer = Date.now();
                } else {
                  current_status = HTTP_DEFAULT_DISABLE_CODE;
                }
                // Update entry if successful
                if (current_status == HTTP_OK_CODE) {
                  Tracking.update(
                    {
                      carrier: result.carrier ? result.carrier : results.tracking_dhl[i].carrier,
                      country: result.country,
                      lastchecked: Date.now(),
                      status: result.status,
                      shippeddate: result.shippeddate,
                      delivereddate: result.delivered,
                      delivered: result.delivered > limit_date.getTime() ? true : false,
                      data: result.rawdata
                    },
                    {
                      where: { id: results.tracking_dhl[i].id }
                    }
                  );
                  last_tracked.count++;
                }
              }
            }
            callback(null, 'OK');
          }
        },
        function(err, results2) {
          const time_now = new Date();
          console.log(`#${counter} tracking started! (${dateToString(time_now)})`);
          last_tracked.date = `${d} ${time_now.getHours()}:${time_now.getMinutes()}`;
        }
      );
    }
  );
}

// Automate tracker
async function Automation() {
  counter++;

  // Check if previous tracking is done
  if (JP_scraping_counter.done == 100 && DHL_scraping_counter.done == 100 && USPS_API_counter.done == 100 && DHL_API_counter.done == 100) {
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
  Automation();
}

// Track (Scrap/API) start route (redirect to dashboard)
exports.track = async (req, res) => {
  counter++;

  // Check if previous tracking is done
  if (JP_scraping_counter.done == 100 && DHL_scraping_counter.done == 100 && USPS_API_counter.done == 100 && DHL_API_counter.done == 100) {
    // Start tracking (ASYNC)
    TrackAll();
  } else {
    // Do not track
    console.log(`Skip#${counter}, due to currently tracking...`);
  }

  // Redirect to dashboard
  res.redirect('/mypage');
};

// Tracking details page
exports.details = async (req, res, next) => {
  const tracking_id = req.params.id;
  let back_link = '/mypage/delivered';
  if (req.headers.referer.indexOf('undelivered') > 0) {
    back_link = '/mypage/undelivered';
  }

  async.parallel(
    {
      tracking: function(callback) {
        Tracking.findAll({
          where: { tracking: tracking_id }
        }).then(entry => callback(null, entry[0]));
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (!results.tracking) {
        // No results.
        res.redirect('/mypage');
      }
      // Successful, so render.
      const tracking_raw = JSON.parse(results.tracking.data);
      res.render('tracking', { id: tracking_id, tracking: tracking_raw.shipments[0].events, back_link });
    }
  );
};

// Get progress route (return JSON)
exports.progress = (req, res) => {
  res.json({ last_tracked, JP_scraping_counter, DHL_scraping_counter, DHL_API_counter, USPS_API_counter });
};

// Download CSV file
exports.csv = async (req, res, next) => {
  /*
  {
  range: 'lastlastmonth',
  range_start: '2020-01-01',
  range_end: '2020-01-31',
  taisho: 'shipped'
  }
  {
  range: '7days',
  range_start: '2020-01-01',
  range_end: '2020-01-31',
  taisho: 'delivered'
  }
  */
  const range_start = req.query.range_start.split('-');
  const range_end = req.query.range_end.split('-');

  const start = new Date(parseInt(range_start[0]), parseInt(range_start[1]) - 1, parseInt(range_start[2]), 0, 0, 0, 0).getTime();
  const end = new Date(parseInt(range_end[0]), parseInt(range_end[1]) - 1, parseInt(range_end[2]), 23, 59, 59, 999).getTime();

  // Generate database search query
  const query = {};
  if (req.query.taisho == 'shipped') {
    query['where'] = {
      shippeddate: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };
  } else {
    query['where'] = {
      delivereddate: {
        [Op.gte]: start,
        [Op.lte]: end
      }
    };
  }

  async.parallel(
    {
      tracking: function(callback) {
        Tracking.findAll(query).then(entry => callback(null, entry));
      }
    },
    function(err, results) {
      if (err) {
        return next(err);
      }
      if (!results.tracking) {
        // No results.
        res.redirect('/mypage');
      }

      // tracking	carrier	country	addeddate	lastchecked	status	shippeddate	delivereddate	delivered	data
      let outdata = `Tracking,Carrier,Country,Added date,Last checked,Status,Shipped date,Delivered date,Delivered,Data`;
      results.tracking.forEach(r => {
        outdata += `\n${r.tracking},${r.carrier},"${r.country}",${r.addeddate},${r.lastchecked},"${r.status}",${r.shippeddate},${
          r.delivereddate
        },${r.delivered},"${r.data.split('"').join("'")}"`;
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${req.query.taisho}_S${req.query.range_start}_E${req.query.range_end}.csv"`
      );
      res.send(outdata);
    }
  );
};

// Remove records delivered more than 14 days ago
exports.clear = async (req, res, next) => {
  // Check if previous tracking is done
  if (JP_scraping_counter.done == 100 && DHL_scraping_counter.done == 100 && USPS_API_counter.done == 100 && DHL_API_counter.done == 100) {
    let d = new Date();
    d = new Date(d.getFullYear() - 1, d.getMonth(), d.getDate());

    // Remove data from database
    Tracking.destroy({
      where: {
        delivered: true,
        delivereddate: {
          [Op.lt]: d.getTime()
        }
      }
    });
  }

  res.redirect('/mypage');
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
