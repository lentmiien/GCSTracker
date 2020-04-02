// Require necessary database models
const async = require('async');
const { Tracking, Op } = require('../sequelize');

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
      console.log(`---${new Date()}---[api_add]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      console.log(`---${new Date()}---[api_add]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
  }

  // Get new data
  // req.body = { records: [ 'rec1', 'rec2', 'rec3' ], date: date_timestamp }
  const tracking = req.body.records.sort();
  const records_to_add = [];

  let d = new Date();
  d = dateToString(d);

  let dts = req.body.date && req.body.date > 0 ? req.body.date : Date.now();

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

  async.parallel(
    {
      tracking: function(callback) {
        Tracking.findAll({ attributes: ['tracking'] }).then(entry => callback(null, entry));
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

      let lastadded = '';
      for (let i = 0; i < tracking.length; i++) {
        let new_entry = true;
        if (tracking[i].indexOf('-') < 0 && tracking[i].length > 8) {
          if (tracking[i].indexOf('JP') < 0 && tracking[i].length == 12) {
            // Does not support domestic shipping
            new_entry = false;
            response['domestic']++;
          } else if (/^\d+$/.test(tracking[i]) == false && tracking[i].indexOf('JP') < 0) {
            // A package shipped to Japan, treat as domestic shipping
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
              for (let row_i = 0; row_i < results.tracking.length && new_entry; row_i++) {
                if (results.tracking[row_i].tracking == tracking[i]) {
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
            country: 'UNKNOWN',
            addeddate: dts,
            lastchecked: 0,
            status: 'Shipped',
            shippeddate: dts,
            delivereddate: 0,
            delivered: '0',
            data: ''
          });
          response['added_records']++;
        }
      }

      // Start adding
      if (records_to_add.length > 0) {
        Tracking.bulkCreate(records_to_add);
      }

      // Done!
      console.log(`---${new Date()}---[api_add]\n${JSON.stringify(response, null, 2)}`);
      res.json(response);
    }
  );
};

exports.api_report = async (req, res) => {
  const response = { status: 'OK' };

  // If you are a logged in user, then no need to check API key
  if (res.locals.role != 'admin') {
    const api_key = req.header('api-key');
    if (api_key == undefined) {
      response['status'] = 'ERROR';
      response['message'] = 'No API key';
      console.log(`---${new Date()}---\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      console.log(`---${new Date()}---\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
  }

  // Get new data
  // req.body = {
  //   lost: [ 'rec1', 'rec2', 'rec3' ],
  //   delivered: [ {id:'rec4', timestamp:'12315646546'} ],
  //   returned: [ 'rec5', 'rec6', 'rec7' ]
  // }
  const lost = req.body.lost;
  const delivered = req.body.delivered;
  const returned = req.body.returned;

  // Update all lost records
  lost.forEach(r => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'lost',
          delivereddate: 0,
          delivered: true
        },
        {
          where: { tracking: r }
        }
      );
    }
  });

  // Update all delivered records
  delivered.forEach(r => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'delivered',
          delivereddate: 1,
          delivered: true
        },
        {
          where: { tracking: r, delivered: false }
        }
      );
    }
  });

  // Update all returned records
  returned.forEach(r => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'returned',
          delivereddate: 0,
          delivered: true
        },
        {
          where: { tracking: r }
        }
      );
    }
  });

  // Done!
  console.log(`---${new Date()}---\n${JSON.stringify(response, null, 2)}`);
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
      console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
  }

  // Verify dates
  let start = req.params.startdate;
  let end = req.params.enddate;
  if (start > end) {
    // Swap dates if in wrong order
    const tmp = start;
    start = end;
    end = tmp;
  }
  if (start.indexOf('-') != 4 || end.indexOf('-') != 4 || start.length != 10 || end.length != 10) {
    response['status'] = 'ERROR';
    response['message'] = 'Invalid date range';
    console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
    return res.json(response);
  }
  const start_split = start.split('-');
  const end_split = end.split('-');
  const start_date = new Date(parseInt(start_split[0]), parseInt(start_split[1]) - 1, parseInt(start_split[2]), 0, 0, 0, 0).getTime();
  const end_date = new Date(parseInt(end_split[0]), parseInt(end_split[1]) - 1, parseInt(end_split[2]), 23, 59, 59, 999).getTime();

  async.parallel(
    {
      tracking: function(callback) {
        Tracking.findAll({
          where: {
            lastchecked: {
              [Op.gte]: start_date,
              [Op.lte]: end_date
            },
            delivered: true
          }
        }).then(entry => callback(null, entry));
      }
    },
    function(err, results) {
      if (err) {
        response['status'] = 'ERROR';
        response['message'] = 'Database error';
        console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
        return res.json(response);
      }
      if (!results.tracking) {
        // No results.
        response['status'] = 'WARNING';
        response['message'] = 'No records';
        console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
        return res.json(response);
      }

      // Prepare OK response
      response['status'] = 'OK';
      let d = new Date();
      response['date'] = dateToString(d);
      response['records'] = [];

      // tracking	delivereddate	delivered
      results.tracking.forEach(r => {
        if (r.delivereddate > 0) {
          response['records'].push({
            tracking: r.tracking,
            delivereddate: dateToString(new Date(r.delivereddate)),
            delivered: r.delivered
          });
        }
      });

      console.log(`---${new Date()}---[api_get]\n${JSON.stringify(response, null, 2)}`);
      res.json(response);
    }
  );
};

///api/csv?labels=Tracking&columns=tracking&carrier=INVALID
exports.api_csv = async (req, res) => {
  // If you are a logged in user, then no need to check API key
  if (res.locals.role != 'admin') {
    const api_key = req.header('api-key');
    if (api_key == undefined) {
      response['status'] = 'ERROR';
      response['message'] = 'No API key';
      console.log(`---${new Date()}---[api_csv]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
    if (api_key != process.env.THIS_API_KEY) {
      response['status'] = 'ERROR';
      response['message'] = 'Invalid API key';
      console.log(`---${new Date()}---[api_csv]\n${JSON.stringify(response, null, 2)}`);
      return res.json(response);
    }
  }

  // Generate database search query
  // labels=Tracking&columns=tracking&carrier=INVALID
  const keys = Object.keys(req.query);
  const where = {};
  keys.forEach(key => {
    if (!(key == 'labels' || key == 'columns')) {
      where[key] = req.query[key];
    }
  });

  async.parallel(
    {
      tracking: function(callback) {
        Tracking.findAll({ where }).then(entry => callback(null, entry));
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

      // labels=Tracking&columns=tracking&carrier=INVALID
      const cols = req.query.columns.split(',');
      let outdata = req.query.labels;
      results.tracking.forEach(r => {
        outdata += `\n${r[cols[0]]}`;
        for (let i = 1; i < cols.length; i++) {
          outdata += `,${r[cols[i]]}`;
        }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Download_${Date.now()}.csv"`);
      console.log(`---${new Date()}---[api_csv]\n${JSON.stringify(response, null, 2)}`);
      res.send(outdata);
    }
  );
};

// Helper functions
function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
