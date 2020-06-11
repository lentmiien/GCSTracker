// Require used packages
const getResults = require('../scraper');
const getResultsAPI = require('../tracker');

// Require necessary database models
const async = require('async');
const { Tracking, Op } = require('../sequelize');

// Runtime logger
const { Log, GetLog } = require('../runlog');

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
const DHL_MIN_DELAY_TIME = 2000;
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

// Open dashboard page
exports.mypage = (req, res, next) => {
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll().then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const undelivered_rows = results.tracking.filter((row) => row.delivereddate == 0 && row.delivered == false);
      const delivered_one_month_rows = results.tracking.filter(
        (row) => row.delivereddate > 1 && row.delivereddate > Date.now() - 2592000000
      );

      let dhl_time = 0;
      let dhl_time_count = 0;
      let ems_time = 0;
      let ems_time_count = 0;
      let other_time = 0;
      let other_time_count = 0;
      delivered_one_month_rows.forEach((data) => {
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
      dhl_time = Math.round(10 * (dhl_time / dhl_time_count)) / 10;
      ems_time = Math.round(10 * (ems_time / ems_time_count)) / 10;
      other_time = Math.round(10 * (other_time / other_time_count)) / 10;

      const undelivered = {
        last7days: {
          limit: Date.now() - 604800000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0,
        },
        last30days: {
          limit: Date.now() - 2592000000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0,
        },
        last90days: {
          limit: Date.now() - 7776000000,
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0,
        },
        all: {
          number_of_records: 0,
          dhl_records: 0,
          ems_records: 0,
          other_records: 0,
        },
        invalid: 0,
        has_old: false,
      };
      undelivered_rows.forEach((row) => {
        if (row.carrier == 'INVALID') {
          undelivered.invalid++;
        } else {
          if (row.shippeddate < DaysAgo(180) && row.delivered == 0) {
            undelivered.has_old = true;
          }
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
        }
      });

      res.render('dashboard', { dhl_time, ems_time, other_time, undelivered });
    }
  );
};
// Check status distribution
exports.status_check = (req, res, next) => {
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll().then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const undelivered_rows = results.tracking.filter((row) => row.delivereddate == 0 && row.delivered == false);

      const undelivered = { status_counter: [] };
      undelivered_rows.forEach((row) => {
        let new_status = true;
        for (let i = 0; i < undelivered.status_counter.length && new_status; i++) {
          if (undelivered.status_counter[i].status == row.status) {
            undelivered.status_counter[i].count++;
            new_status = false;
          }
        }
        if (new_status) {
          undelivered.status_counter.push({
            status: row.status,
            count: 1,
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

      res.render('status', { undelivered });
    }
  );
};

// Show all invalid records
exports.invalid = (req, res, next) => {
  async.parallel(
    {
      invalid: (callback) => {
        Tracking.findAll({ where: { carrier: 'INVALID' } }).then((data) => callback(null, data));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      res.render('invalid', { records: results.invalid });
    }
  );
};
exports.process_invalid = (req, res, next) => {
  Tracking.destroy({ where: { id: req.params.id } })
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(() => {
      res.json({ status: 'ERROR' });
    });
};
exports.process_valid = (req, res, next) => {
  Tracking.update({ carrier: req.params.carrier }, { where: { id: req.params.id } })
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(() => {
      res.json({ status: 'ERROR' });
    });
};

// Show all undelivered packages
// /:carrier/:start/:end
exports.undelivered = async (req, res, next) => {
  const d_link = {
    columns: 'tracking,country,status,shippeddate',
    query_terms: [
      {
        key: 'done',
        value: '0',
      },
    ],
  };
  const query = {
    order: [['shippeddate', 'ASC']],
    where: {
      delivereddate: 0,
      delivered: 0,
    },
  };
  if (req.params.carrier && req.params.start && req.params.end) {
    if (req.params.carrier == 'dhl') {
      query.where['carrier'] = 'DHL';
    } else if (req.params.carrier == 'ems') {
      query.where['tracking'] = {
        [Op.like]: 'EM%',
      };
    } else if (req.params.carrier == 'other') {
      query.where['carrier'] = {
        [Op.not]: 'DHL',
      };
      query.where['tracking'] = {
        [Op.notLike]: 'EM%',
      };
    }
    query.where['shippeddate'] = {
      [Op.gte]: parseInt(req.params.start),
      [Op.lt]: parseInt(req.params.end),
    };
    // Download link
    d_link.query_terms.push({
      key: 'carrier',
      value: req.params.carrier,
    });
    d_link.query_terms.push({
      key: 'shippedfrom',
      value: parseInt(req.params.start),
    });
    d_link.query_terms.push({
      key: 'shippedto',
      value: parseInt(req.params.end),
    });
  }
  if (req.query.carrier && req.query.start && req.query.end) {
    if (req.query.carrier == 'dhl') {
      query.where['carrier'] = 'DHL';
    } else if (req.query.carrier == 'ems') {
      query.where['tracking'] = {
        [Op.like]: 'EM%',
      };
    } else if (req.query.carrier == 'other') {
      query.where['carrier'] = {
        [Op.not]: 'DHL',
      };
      query.where['tracking'] = {
        [Op.notLike]: 'EM%',
      };
    }
    const sdate = req.query.start.split('-');
    const edate = req.query.end.split('-');
    req.query.start = new Date(parseInt(sdate[0]), parseInt(sdate[1]) - 1, parseInt(sdate[2]), 0, 0, 0, 0).getTime();
    req.query.end = new Date(parseInt(edate[0]), parseInt(edate[1]) - 1, parseInt(edate[2]), 23, 59, 59, 999).getTime();
    query.where['shippeddate'] = {
      [Op.gte]: req.query.start,
      [Op.lte]: req.query.end,
    };
    // Download link
    d_link.query_terms.push({
      key: 'carrier',
      value: req.query.carrier,
    });
    d_link.query_terms.push({
      key: 'shippedfrom',
      value: parseInt(req.query.start),
    });
    d_link.query_terms.push({
      key: 'shippedto',
      value: parseInt(req.query.end),
    });
  }
  if (req.query.status) {
    query.where['status'] = req.query.status;
    d_link.query_terms.push({
      key: 'status',
      value: req.query.status,
    });
  }
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll(query).then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter((row) => row.carrier != 'INVALID');

      const analyze = {
        dhl_count: 0,
        ems_count: 0,
        other_count: 0,
      };
      rows.forEach((entry) => {
        if (entry.carrier == 'DHL') {
          analyze.dhl_count++;
        } else if (entry.tracking.indexOf('EM') == 0) {
          analyze.ems_count++;
        } else {
          analyze.other_count++;
        }
      });

      res.render('undelivered', { rows, analyze, filter: req.params.carrier ? req.params : req.query.carrier ? req.query : {}, d_link });
    }
  );
};

// Show country delivery times
exports.undelivered_country = async (req, res, next) => {
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll({
          order: [['country', 'ASC']],
          where: {
            delivered: 0,
          },
        }).then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking.filter((row) => row.country != 'UNKNOWN' && row.carrier != 'INVALID');

      const analyze = {
        overall: {
          all_dhl_count: 0,
          all_ems_count: 0,
          all_other_count: 0,
        },
        countries: [],
      };

      rows.forEach((entry) => {
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
            other_count: 0,
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
      tracking: (callback) => {
        Tracking.findAll({
          where: {
            country: req.params.country,
          },
        }).then((entry) => callback(null, entry));
      },
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
          current_shipping_times: { dhl: [], dhl_ems: [], all: [] },
        },
        {
          label: '7日以内',
          start: time - 604800000,
          end: time,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '8日～30日',
          start: time - 2592000000,
          end: time - 604800000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '31日～90日',
          start: time - 7776000000,
          end: time - 2592000000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '91日以上',
          start: 0,
          end: time - 7776000000,
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '今月',
          start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '先月',
          start: new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
        {
          label: '先々月',
          start: new Date(d.getFullYear(), d.getMonth() - 2, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() - 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, notdone: 0 },
          ems_count: { all: 0, notdone: 0 },
          other_count: { all: 0, notdone: 0 },
        },
      ];
      results.tracking.forEach((entry) => {
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
              if (entry.delivereddate == 0) {
                analyze[i].dhl_count.notdone++;
              }
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[i].ems_count.all++;
              if (entry.delivereddate == 0) {
                analyze[i].ems_count.notdone++;
              }
            } else {
              analyze[i].other_count.all++;
              if (entry.delivereddate == 0) {
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
      tracking: (callback) => {
        Tracking.findAll({
          order: [['delivereddate', 'DESC']],
          where: {
            delivereddate: {
              [Op.gte]: one_week,
            },
          },
        }).then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking;

      const analyze = {
        dhl_count: 0,
        ems_count: 0,
        other_count: 0,
      };
      rows.forEach((entry) => {
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
      tracking: (callback) => {
        Tracking.findAll({
          order: [['country', 'ASC']],
          where: {
            delivereddate: {
              [Op.gt]: 0,
            },
          },
        }).then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const rows = results.tracking;

      res.render('delivered_country', { rows });
    }
  );
};

// Show country delivery times
exports.country = async (req, res, next) => {
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll({
          where: {
            country: req.params.country,
          },
        }).then((entry) => callback(null, entry));
      },
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
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          delivery_times: { dhl: [], dhl_ems: [], all: [] },
        },
        {
          label: '7日以内',
          start: time - 604800000,
          end: time,
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '8日～30日',
          start: time - 2592000000,
          end: time - 604800000,
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '31日～90日',
          start: time - 7776000000,
          end: time - 2592000000,
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '91日以上',
          start: 0,
          end: time - 7776000000,
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '今月',
          start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '先月',
          start: new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth(), 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
        {
          label: '先々月',
          start: new Date(d.getFullYear(), d.getMonth() - 2, 1, 0, 0, 0, 0).getTime(),
          end: new Date(d.getFullYear(), d.getMonth() - 1, 0, 23, 59, 59, 999).getTime(),
          dhl_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          ems_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
          other_count: { all: 0, done: 0, days: 0, unknown_days: 0 },
        },
      ];
      results.tracking.forEach((entry) => {
        let days = 0;
        if (entry.delivereddate > 1) {
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
                if (entry.delivereddate == 1) {
                  analyze[i].dhl_count.unknown_days++;
                }
              }
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[i].ems_count.all++;
              if (entry.delivered == true && entry.delivereddate > 0) {
                analyze[i].ems_count.done++;
                analyze[i].ems_count.days += days;
                if (entry.delivereddate == 1) {
                  analyze[i].ems_count.unknown_days++;
                }
              }
            } else {
              analyze[i].other_count.all++;
              if (entry.delivered == true && entry.delivereddate > 0) {
                analyze[i].other_count.done++;
                analyze[i].other_count.days += days;
                if (entry.delivereddate == 1) {
                  analyze[i].other_count.unknown_days++;
                }
              }
            }
          }
        }
      });

      res.render('country', { analyze, country: req.params.country });
    }
  );
};

// Show country delivery trends
exports.countrytrend = async (req, res, next) => {
  async.parallel(
    {
      tracking: (callback) => {
        Tracking.findAll({
          where: {
            country: req.params.country,
          },
        }).then((entry) => callback(null, entry));
      },
    },
    (err, results) => {
      if (err) {
        return next(err);
      }
      const analyze = []; // { date: '2020-04-01', DHL_total_days: 100, DHL_count_all: 25, ..., DHL_count_new: 25, ..., DHL_count_done: 25, ... }
      results.tracking.forEach((entry) => {
        // Date interval for this shipment
        let start_date = new Date(entry.shippeddate);
        let end_date = entry.delivereddate > 1 ? new Date(entry.delivereddate) : entry.delivereddate == 1 ? start_date : new Date();

        // Average values
        if (entry.delivereddate > 1) {
          let days = (entry.delivereddate - entry.shippeddate) / 86400000;
          const date_str = dateToString(end_date);
          let updated = false;
          for (let i = 0; i < analyze.length && updated == false; i++) {
            if (analyze[i].date == date_str) {
              if (entry.carrier == 'DHL') {
                analyze[i].DHL_total_days += days;
                analyze[i].DHL_total_count++;
              } else if (entry.tracking.indexOf('EM') == 0) {
                analyze[i].EMS_total_days += days;
                analyze[i].EMS_total_count++;
              } else {
                analyze[i].OTHER_total_days += days;
                analyze[i].OTHER_total_count++;
              }
              updated = true;
            }
          }
          if (updated == false) {
            // A new entry
            const index = analyze.length;
            analyze.push({
              date: date_str,
              DHL_total_days: 0,
              DHL_total_count: 0,
              DHL_count_all: 0,
              DHL_count_new: 0,
              DHL_count_lost: 0,
              DHL_count_done: 0,
              EMS_total_days: 0,
              EMS_total_count: 0,
              EMS_count_all: 0,
              EMS_count_new: 0,
              EMS_count_lost: 0,
              EMS_count_done: 0,
              OTHER_total_days: 0,
              OTHER_total_count: 0,
              OTHER_count_all: 0,
              OTHER_count_new: 0,
              OTHER_count_lost: 0,
              OTHER_count_done: 0,
            });
            if (entry.carrier == 'DHL') {
              analyze[index].DHL_total_days += days;
              analyze[index].DHL_total_count++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[index].EMS_total_days += days;
              analyze[index].EMS_total_count++;
            } else {
              analyze[index].OTHER_total_days += days;
              analyze[index].OTHER_total_count++;
            }
          }
        }

        // Delivered count
        if (entry.delivereddate > 0) {
          const date_str = dateToString(end_date);
          let updated = false;
          for (let i = 0; i < analyze.length && updated == false; i++) {
            if (analyze[i].date == date_str) {
              if (entry.carrier == 'DHL') {
                analyze[i].DHL_count_done++;
              } else if (entry.tracking.indexOf('EM') == 0) {
                analyze[i].EMS_count_done++;
              } else {
                analyze[i].OTHER_count_done++;
              }
              updated = true;
            }
          }
          if (updated == false) {
            // A new entry
            const index = analyze.length;
            analyze.push({
              date: date_str,
              DHL_total_days: 0,
              DHL_total_count: 0,
              DHL_count_all: 0,
              DHL_count_new: 0,
              DHL_count_lost: 0,
              DHL_count_done: 0,
              EMS_total_days: 0,
              EMS_total_count: 0,
              EMS_count_all: 0,
              EMS_count_new: 0,
              EMS_count_lost: 0,
              EMS_count_done: 0,
              OTHER_total_days: 0,
              OTHER_total_count: 0,
              OTHER_count_all: 0,
              OTHER_count_new: 0,
              OTHER_count_lost: 0,
              OTHER_count_done: 0,
            });
            if (entry.carrier == 'DHL') {
              analyze[index].DHL_count_done++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[index].EMS_count_done++;
            } else {
              analyze[index].OTHER_count_done++;
            }
          }
        }

        // Shipped count
        if (!(entry.delivereddate == 0 && entry.delivered == true)) {
          const date_str = dateToString(start_date);
          let updated = false;
          for (let i = 0; i < analyze.length && updated == false; i++) {
            if (analyze[i].date == date_str) {
              if (entry.carrier == 'DHL') {
                analyze[i].DHL_count_new++;
              } else if (entry.tracking.indexOf('EM') == 0) {
                analyze[i].EMS_count_new++;
              } else {
                analyze[i].OTHER_count_new++;
              }
              updated = true;
            }
          }
          if (updated == false) {
            // A new entry
            const index = analyze.length;
            analyze.push({
              date: date_str,
              DHL_total_days: 0,
              DHL_total_count: 0,
              DHL_count_all: 0,
              DHL_count_new: 0,
              DHL_count_lost: 0,
              DHL_count_done: 0,
              EMS_total_days: 0,
              EMS_total_count: 0,
              EMS_count_all: 0,
              EMS_count_new: 0,
              EMS_count_lost: 0,
              EMS_count_done: 0,
              OTHER_total_days: 0,
              OTHER_total_count: 0,
              OTHER_count_all: 0,
              OTHER_count_new: 0,
              OTHER_count_lost: 0,
              OTHER_count_done: 0,
            });
            if (entry.carrier == 'DHL') {
              analyze[index].DHL_count_new++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[index].EMS_count_new++;
            } else {
              analyze[index].OTHER_count_new++;
            }
          }
        }

        // Lost/Returned count
        if (entry.delivereddate == 0 && entry.delivered == true) {
          end_date = start_date;
          const date_str = dateToString(start_date);
          let updated = false;
          for (let i = 0; i < analyze.length && updated == false; i++) {
            if (analyze[i].date == date_str) {
              if (entry.carrier == 'DHL') {
                analyze[i].DHL_count_lost++;
              } else if (entry.tracking.indexOf('EM') == 0) {
                analyze[i].EMS_count_lost++;
              } else {
                analyze[i].OTHER_count_lost++;
              }
              updated = true;
            }
          }
          if (updated == false) {
            // A new entry
            const index = analyze.length;
            analyze.push({
              date: date_str,
              DHL_total_days: 0,
              DHL_total_count: 0,
              DHL_count_all: 0,
              DHL_count_new: 0,
              DHL_count_lost: 0,
              DHL_count_done: 0,
              EMS_total_days: 0,
              EMS_total_count: 0,
              EMS_count_all: 0,
              EMS_count_new: 0,
              EMS_count_lost: 0,
              EMS_count_done: 0,
              OTHER_total_days: 0,
              OTHER_total_count: 0,
              OTHER_count_all: 0,
              OTHER_count_new: 0,
              OTHER_count_lost: 0,
              OTHER_count_done: 0,
            });
            if (entry.carrier == 'DHL') {
              analyze[index].DHL_count_lost++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[index].EMS_count_lost++;
            } else {
              analyze[index].OTHER_count_lost++;
            }
          }
        }

        // All count
        // Skip first day (counted in new or lost)
        start_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate() + 1);
        while (start_date.getTime() <= end_date.getTime()) {
          const date_str = dateToString(start_date);
          let updated = false;
          for (let i = 0; i < analyze.length && updated == false; i++) {
            if (analyze[i].date == date_str) {
              if (entry.carrier == 'DHL') {
                analyze[i].DHL_count_all++;
              } else if (entry.tracking.indexOf('EM') == 0) {
                analyze[i].EMS_count_all++;
              } else {
                analyze[i].OTHER_count_all++;
              }
              updated = true;
            }
          }
          if (updated == false) {
            // A new entry
            const index = analyze.length;
            analyze.push({
              date: date_str,
              DHL_total_days: 0,
              DHL_total_count: 0,
              DHL_count_all: 0,
              DHL_count_new: 0,
              DHL_count_lost: 0,
              DHL_count_done: 0,
              EMS_total_days: 0,
              EMS_total_count: 0,
              EMS_count_all: 0,
              EMS_count_new: 0,
              EMS_count_lost: 0,
              EMS_count_done: 0,
              OTHER_total_days: 0,
              OTHER_total_count: 0,
              OTHER_count_all: 0,
              OTHER_count_new: 0,
              OTHER_count_lost: 0,
              OTHER_count_done: 0,
            });
            if (entry.carrier == 'DHL') {
              analyze[index].DHL_count_all++;
            } else if (entry.tracking.indexOf('EM') == 0) {
              analyze[index].EMS_count_all++;
            } else {
              analyze[index].OTHER_count_all++;
            }
          }
          // Step forward one day
          start_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate() + 1);
        }
      });

      res.render('countrytrend', { analyze, country: req.params.country });
    }
  );
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

  // DHL checks, first check after 3 days, then check every day (1 day = 86400000 ms)
  let dhlfc = DaysAgo(3);
  let dhlnc = DaysAgo(1);

  // Postal checks, first check after 7 days, then check every 3rd day
  let postalfc = DaysAgo(7);
  let postalnc = DaysAgo(3);

  // Stop tracking after 90 days
  const cutoff = DaysAgo(90);

  async.parallel(
    {
      tracking_jp: function (callback) {
        Tracking.findAll({
          where: {
            carrier: 'JP',
            delivered: false,
            shippeddate: {
              [Op.gte]: cutoff,
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
              [Op.lte]: postalnc,
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
              [Op.gte]: cutoff,
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
      const url = `https://trackings.post.japanpost.jp/services/srv/search/direct?reqCodeNo1=${item.tracking}&searchKind=S002&locale=ja`;
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
  }
  DHL_API_counter.nowtracking = '';
  DHL_scraping_counter.nowtracking = '';
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
  } /* else {
    // Do not track
    return res.render('forcetracking', {
      counter,
      jp: JP_scraping_counter.done,
      dhl: DHL_scraping_counter.done,
      uspsapi: USPS_API_counter.done,
      dhlapi: DHL_API_counter.done
    });
  }*/

  // Redirect to dashboard
  res.redirect('/mypage');
};
exports.forcetracking = (req, res) => {
  counter++;
  TrackAll();
  res.redirect('/mypage');
};

// Tracking details page
exports.details = async (req, res, next) => {
  const tracking_id = req.params.id;
  let back_link = '/mypage/delivered';
  if (req.headers.referer && req.headers.referer.indexOf('undelivered') > 0) {
    back_link = '/mypage/undelivered';
  }

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll({
          where: { tracking: tracking_id },
        }).then((entry) => callback(null, entry[0]));
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (!results.tracking) {
        // No results.
        res.redirect('/mypage');
      }
      // Successful, so render.
      const tracking_raw = JSON.parse(results.tracking.data.length > 0 ? results.tracking.data : '{"shipments":[{"events":[]}]}');
      res.render('tracking', { id: tracking_id, db_data: results.tracking, tracking: tracking_raw.shipments[0].events, back_link });
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
        [Op.lte]: end,
      },
    };
  } else {
    query['where'] = {
      delivereddate: {
        [Op.gte]: start,
        [Op.lte]: end,
      },
    };
  }

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll(query).then((entry) => callback(null, entry));
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (!results.tracking) {
        // No results.
        res.redirect('/mypage');
      }

      // tracking	carrier	country	addeddate	lastchecked	status	shippeddate	delivereddate	delivered	data
      let outdata = `Tracking,Carrier,Country,Added date,Last checked,Status,Shipped date,Delivered date,Delivered,Data`;
      results.tracking.forEach((r) => {
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
          [Op.lt]: d.getTime(),
        },
      },
    });
  }

  res.redirect('/mypage');
};

// Old records
exports.list_old = (req, res) => {
  Tracking.findAll({
    where: {
      delivered: false,
      shippeddate: {
        [Op.lt]: DaysAgo(180),
      },
    },
  }).then((result) => {
    res.render('old_list', { result });
  });
};
exports.old_set_status = (req, res) => {
  const id = req.params.id;
  const request = req.params.request;

  // Delete request
  if (request == 'delete') {
    Tracking.destroy({ where: { id } });
  } else {
    // Update status request
    const to_update = {
      delivereddate: request == 'Delivered' ? 1 : 0,
      delivered: true,
      status: request,
    };
    Tracking.update(to_update, { where: { id } });
  }

  res.json({ status: 'OK' });
};

exports.report = (req, res) => {
  res.render('report');
};

exports.log = (req, res) => {
  res.render('log', { logdata: GetLog() });
};

// Data maintenance
exports.maintenance = (req, res) => {
  const query = {
    where: {
      [Op.or]: [
        {
          shippeddate: {
            [Op.lt]: new Date(2020, 0, 1).getTime(),
          },
        },
        {
          delivered: false,
          delivereddate: {
            [Op.not]: 0,
          },
        },
        {
          delivered: true,
          status: {
            [Op.not]: 'Returned',
            [Op.not]: 'Lost',
            [Op.not]: 'returned',
          },
          delivereddate: {
            [Op.not]: 1,
            [Op.lt]: new Date(2020, 0, 1).getTime(),
          },
        },
      ],
    },
  };

  Tracking.findAll(query).then((result) => {
    res.render('maintenance', { result });
  });
};
exports.update = (req, res) => {
  const s_date = req.body.shippeddate.split('-');
  const d_date = req.body.delivereddate.split('-');
  const update_data = {
    carrier: req.body.carrier,
    country: req.body.country,
    status: req.body.status,
    shippeddate: new Date(parseInt(s_date[0]), parseInt(s_date[1]) - 1, parseInt(s_date[2]), 12, 0, 0).getTime(),
    delivereddate: new Date(parseInt(d_date[0]), parseInt(d_date[1]) - 1, parseInt(d_date[2]), 12, 0, 0).getTime(),
    done: req.body.delivered == '1' ? true : false,
  };

  Tracking.update(update_data, { where: { tracking: req.body.tracking } });

  res.redirect(`/mypage/details/${req.body.tracking}`);
};

exports.search_reporting = (req, res) => {
  res.render('search_reporting');
};
exports.search_reporting_result = async (req, res) => {
  /*
  req.body.searchcontent = [
    tracking_1,
    tracking_2,
    tracking_3,
    .
    .
    tracking_n,
  ]
  */
  // Records to check
  const rtc = req.body.searchcontent;

  // Aquire Database data
  const DB_data = (await Tracking.findAll()).filter((d) => rtc.indexOf(d.tracking) >= 0);

  // Check that status of the records and put together a simple JSON report, which is returned to user
  const report = {
    total_records: DB_data.length,
    delivered_status: {
      delivered: 0,
      inprogressindestination: 0,
      delayedinjapan: 0,
    },
    country_distribution: {
      namelist: [],
      countlist: [],
    },
    status_distribution: {
      namelist: [],
      countlist: [],
    },
    tracking_details: [],
  };

  // SAMPLE
  DB_data.forEach((data) => {
    // Delivered status
    let progress;
    if (data.delivereddate > 0) {
      report.delivered_status.delivered++;
      progress = 'delivered';
    } else if (data.country != 'JAPAN' && data.country != 'UNKNOWN') {
      report.delivered_status.inprogressindestination++;
      progress = 'inprogressindestination';
    } else {
      report.delivered_status.delayedinjapan++;
      progress = 'delayedinjapan';
    }

    // Country
    let index = report.country_distribution.namelist.indexOf(data.country);
    if (index == -1) {
      report.country_distribution.namelist.push(data.country);
      report.country_distribution.countlist.push(1);
    } else {
      report.country_distribution.countlist[index]++;
    }

    // Status
    index = report.status_distribution.namelist.indexOf(data.status);
    if (index == -1) {
      report.status_distribution.namelist.push(data.status);
      report.status_distribution.countlist.push(1);
    } else {
      report.status_distribution.countlist[index]++;
    }

    // Tracking details
    report.tracking_details.push({
      tracking: data.tracking,
      progress,
      country: data.country,
      status: data.status,
    });
  });

  // Done
  res.json(report);
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

function DaysAgo(days) {
  return Date.now() - 86400000 * days;
}
