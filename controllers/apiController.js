// Require necessary database models
const async = require('async');
const csvtojson = require("csvtojson");
const { Country, Countrylist, Tracking, Grouplabel, Op } = require('../sequelize');

// Runtime logger
const { Log, GetLog } = require('../runlog');

//---------------------------------------------//
// exports.endpoints = (req, res, next) => {}; //
//---------------------------------------------//

/**************/
/* API routes */
/**************/

exports.login_check = (req, res, next) => {
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

  next();
};

// currently not implemented in vue
exports.api_report = async (req, res) => {
  const response = { status: 'OK' };

  // Get new data
  // req.body = {
  //   lost: [ 'rec1', 'rec2', 'rec3' ],
  //   delivered: [ id:'rec4' ],
  //   returned: [ 'rec5', 'rec6', 'rec7' ]
  // }
  const lost = req.body.lost;
  const delivered = req.body.delivered;
  const returned = req.body.returned;

  // Update all lost records
  lost.forEach((r) => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'lost',
          delivereddate: 0,
          delivered: true,
        },
        {
          where: { tracking: r },
        }
      );
    }
  });

  // Update all delivered records
  delivered.forEach((r) => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'delivered',
          delivereddate: 1,
          delivered: true,
        },
        {
          where: { tracking: r, delivered: false },
        }
      );
    }
  });

  // Update all returned records
  returned.forEach((r) => {
    if (r.length > 0) {
      Tracking.update(
        {
          status: 'returned',
          delivereddate: 0,
          delivered: true,
        },
        {
          where: { tracking: r },
        }
      );
    }
  });

  // Done!
  Log('Report API', JSON.stringify(response, null, 2));
  res.json(response);
};

// GET get "delivered" or "not delivered" status
// /get/:startdate/:enddate
exports.api_get = async (req, res) => {
  const response = {};

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
    return res.json(response);
  }
  const start_split = start.split('-');
  const end_split = end.split('-');
  const start_date = new Date(parseInt(start_split[0]), parseInt(start_split[1]) - 1, parseInt(start_split[2]), 0, 0, 0, 0).getTime();
  const end_date = new Date(parseInt(end_split[0]), parseInt(end_split[1]) - 1, parseInt(end_split[2]), 23, 59, 59, 999).getTime();

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll({
          where: {
            lastchecked: {
              [Op.gte]: start_date,
              [Op.lte]: end_date,
            },
            delivered: true,
          },
        }).then((entry) => callback(null, entry));
      },
    },
    function (err, results) {
      if (err) {
        response['status'] = 'ERROR';
        response['message'] = 'Database error';
        return res.json(response);
      }
      if (!results.tracking) {
        // No results.
        response['status'] = 'WARNING';
        response['message'] = 'No records';
        return res.json(response);
      }

      // Prepare OK response
      response['status'] = 'OK';
      let d = new Date();
      response['date'] = dateToString(d);
      response['records'] = [];

      // tracking	delivereddate	delivered
      results.tracking.forEach((r) => {
        if (r.delivereddate > 0) {
          response['records'].push({
            tracking: r.tracking,
            delivereddate: dateToString(new Date(r.delivereddate)),
            delivered: r.delivered,
          });
        }
      });

      res.json(response);
    }
  );
};

///api/csv?getcolumns=tracking,status&s_carrier=INVALID&s_shippedfrom=12345678912
exports.api_csv = async (req, res) => {
  // Create search query
  const where = {};
  // tracking
  if (req.query.tracking) {
    where['tracking'] = req.query.tracking;
  }
  // carrier
  if (req.query.carrier) {
    if (req.query.carrier == 'ems') {
      where['tracking'] = {
        [Op.like]: 'EM%',
      };
    } else if (req.query.carrier == 'other') {
      where['carrier'] = {
        [Op.not]: 'DHL',
      };
      where['tracking'] = {
        [Op.notLike]: 'EM%',
      };
    } else if (req.query.carrier != 'all') {
      where['carrier'] = req.query.carrier;
    }
  }
  // country
  if (req.query.country) {
    where['country'] = req.query.country;
  }
  // tracking_country
  if (req.query.tracking_country) {
    //where['tracking_country'] = req.query.tracking_country;
  }
  // status
  if (req.query.status) {
    where['status'] = req.query.status;
  }
  // delivered ("done")
  if (req.query.done) {
    where['delivered'] = req.query.done == 1 ? true : false;
  }
  // Time query
  // shippeddate
  if (req.query.shippedfrom) {
    if (req.query.shippedto) {
      where['shippeddate'] = {
        [Op.gte]: parseInt(req.query.shippedfrom),
        [Op.lte]: parseInt(req.query.shippedto),
      };
    } else {
      where['shippeddate'] = {
        [Op.gte]: parseInt(req.query.shippedfrom),
      };
    }
  } else if (req.query.shippedto) {
    where['shippeddate'] = {
      [Op.lte]: parseInt(req.query.shippedto),
    };
  }
  // delivereddate
  if (req.query.deliveredfrom) {
    if (req.query.deliveredto) {
      where['delivereddate'] = {
        [Op.gte]: parseInt(req.query.deliveredfrom),
        [Op.lte]: parseInt(req.query.deliveredto),
      };
    } else {
      where['delivereddate'] = {
        [Op.gte]: parseInt(req.query.deliveredfrom),
      };
    }
  } else if (req.query.deliveredto) {
    where['delivereddate'] = {
      [Op.lte]: parseInt(req.query.deliveredto),
    };
  }

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll({ where }).then((entry) => callback(null, entry));
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

      // labels=Tracking&columns=tracking&carrier=INVALID
      const cols = req.query.columns.split(',');
      let outdata = req.query.columns;
      results.tracking.forEach((r) => {
        outdata += `\n${r[cols[0]]}`;
        for (let i = 1; i < cols.length; i++) {
          if (cols[i] == 'shippeddate' || cols[i] == 'delivereddate') {
            outdata += `,${dateToString(new Date(r[cols[i]]))}`;
          } else {
            outdata += `,${r[cols[i]]}`;
          }
        }
      });

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="Download_${Date.now()}.csv"`);
      res.send(outdata);
    }
  );
};

/**********************/
/* Frontend app (vue) */
/**********************/

// POST add new records
exports.api_add = async (req, res) => {
  const response = {};
  const where = {
    addeddate: {
      [Op.gte]: Date.now() - 7776000000
    }
  };// Only load records from last 3 months (adding records older is unsafe)

  // Get new data
  // req.body = { records: [ 'rec1', 'rec2', 'rec3' ], date: date_timestamp, labelid: #number }
  const tracking = req.body.records.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0;
    }
  });
  const records_to_add = [];

  // Set label
  const grouplabel = req.body.label;

  let d = new Date();
  d = dateToString(d);

  let dts = req.body.timestamp && req.body.timestamp > 0 ? req.body.timestamp : Date.now();

  // Prepare OK response
  response['status'] = 'OK';
  response['num_records'] = tracking.length;
  response['date'] = dateToString(new Date(parseInt(dts)));
  response['added_records'] = 0;
  response['sal_unreg_empty'] = 0;
  response['domestic'] = 0;
  response['duplicates'] = 0;
  response['existing'] = 0;
  response['need_check'] = [];

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll({ attributes: ['tracking'], where }).then((entry) => callback(null, entry));
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

      let lastadded = '';
      for (let i = 0; i < tracking.length; i++) {
        let valid_entry = false;
        let new_entry = true;

        // Check valid
        const length = tracking[i].id.length;
        const isnum = /^\d+$/.test(tracking[i].id);
        if (length == 34 && isnum && tracking[i].id.indexOf('420') == 0) {
          valid_entry = true; // AIT
        }
        if ((length == 26 || length == 22) && isnum && tracking[i].id.indexOf('9') == 0) {
          valid_entry = true; // AIT
        }
        if (length == 13 && !isnum && tracking[i].id.indexOf('JP') == 11) {
          valid_entry = true; // JP
        }
        if ((length == 10 && isnum) || (length == 20 && !isnum)) {
          valid_entry = true; // DHL
        }

        // Check existing (only if valid)
        if (valid_entry) {
          if (tracking[i].id == lastadded) {
            new_entry = false;
            response['duplicates']++;
            response['status'] = 'WARNING';
            response['message'] = 'Duplicate records exist';
            response['need_check'].push(tracking[i].id);
          } else {
            for (let row_i = 0; row_i < results.tracking.length && new_entry; row_i++) {
              if (results.tracking[row_i].tracking == tracking[i].id) {
                new_entry = false;
                response['existing']++;
                response['status'] = 'WARNING';
                response['message'] = 'Existing records exist';
                response['need_check'].push(tracking[i].id);
              }
            }
          }
        }
        if (valid_entry && new_entry) {
          lastadded = tracking[i].id;

          let carrier = 'DHL';
          if (tracking[i].id.indexOf('JP') == 11) {
            carrier = 'JP';
          } else if (tracking[i].id.length == 34 || tracking[i].id.length == 26 || tracking[i].id.length == 22) {
            carrier = 'USPS';
          }

          records_to_add.push({
            tracking: tracking[i].id,
            carrier,
            country: tracking[i].country,
            addeddate: dts,
            lastchecked: 0,
            status: 'Shipped',
            shippeddate: dts,
            delivereddate: 0,
            delivered: '0',
            data: '',
            grouplabel,
          });
          response['added_records']++;
        }
      }

      // Start adding
      if (records_to_add.length > 0) {
        Tracking.bulkCreate(records_to_add).then(() => {
          Tracking.findAll({
            where: { addeddate: dts, lastchecked: 0 },
            attributes: [
              'tracking',
              'carrier',
              'country',
              'addeddate',
              'lastchecked',
              'status',
              'shippeddate',
              'delivereddate',
              'delivered',
              'grouplabel',
            ],
          })
            .then((result) => res.json(result))
            .catch((err) => console.log(err));
        });
      } else {
        res.json(response);
      }

      // Done!
      Log('Add API', JSON.stringify(response, null, 2));
    }
  );
};

// POST add new records extended
exports.api_addex = async (req, res) => {
  const response = {};
  const where = {
    addeddate: {
      [Op.gte]: Date.now() - 7776000000
    }
  };// Only load records from last 3 months (adding records older is unsafe)

  // Get new data
  // req.body = { records: [ { id: 'tracking1', ship_dts: shipped_date_timestamp, label: #number, country: "country name" }, {}, ... ] }
  const tracking = req.body.records.sort((a, b) => {
    if (a.id < b.id) {
      return -1;
    } else if (a.id > b.id) {
      return 1;
    } else {
      return 0;
    }
  });
  const records_to_add = [];
  let added_dts = Date.now();

  async.parallel(
    {
      tracking: function (callback) {
        Tracking.findAll({ attributes: ['tracking'], where }).then((entry) => callback(null, entry));
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

      let lastadded = '';
      for (let i = 0; i < tracking.length; i++) {
        let valid_entry = false;
        let new_entry = true;

        // Check valid
        const length = tracking[i].id.length;
        const isnum = /^\d+$/.test(tracking[i].id);
        if (length == 34 && isnum && tracking[i].id.indexOf('420') == 0) {
          valid_entry = true; // AIT
        }
        if ((length == 26 || length == 22) && isnum && tracking[i].id.indexOf('9') == 0) {
          valid_entry = true; // AIT
        }
        if (length == 13 && !isnum && tracking[i].id.indexOf('JP') == 11) {
          valid_entry = true; // JP
        }
        if ((length == 10 && isnum) || (length == 20 && !isnum)) {
          valid_entry = true; // DHL
        }

        // Check existing (only if valid)
        if (valid_entry) {
          if (tracking[i].id == lastadded) {
            new_entry = false;
          } else {
            for (let row_i = 0; row_i < results.tracking.length && new_entry; row_i++) {
              if (results.tracking[row_i].tracking == tracking[i].id) {
                new_entry = false;
              }
            }
          }
        }
        if (valid_entry && new_entry) {
          lastadded = tracking[i].id;

          let carrier = 'DHL';
          if (tracking[i].id.indexOf('JP') == 11) {
            carrier = 'JP';
          } else if (tracking[i].id.length == 34 || tracking[i].id.length == 26 || tracking[i].id.length == 22) {
            carrier = 'USPS';
          }

          records_to_add.push({
            tracking: tracking[i].id,
            carrier,
            country: tracking[i].country,
            addeddate: added_dts,
            lastchecked: 0,
            status: 'Shipped',
            shippeddate: tracking[i].ship_dts,
            delivereddate: 0,
            delivered: '0',
            data: '',
            grouplabel: tracking[i].label,
          });
        }
      }

      // Start adding
      if (records_to_add.length > 0) {
        Tracking.bulkCreate(records_to_add).then(() => {
          Tracking.findAll({
            where: { addeddate: added_dts },
            attributes: [
              'tracking',
              'carrier',
              'country',
              'addeddate',
              'lastchecked',
              'status',
              'shippeddate',
              'delivereddate',
              'delivered',
              'grouplabel',
            ],
          })
            .then((result) => res.json(result))
            .catch((err) => console.log(err));
        });
      } else {
        res.json({ failed: 'No records to add' });
      }

      // Done!
      Log('Add API (EX)', `Added ${records_to_add.length} new records`);
    }
  );
};

// POST add new records
exports.api_update = async (req, res) => {
  const update_data = {
    lastchecked: Date.now()
  };
  if(req.body.country != 'UNKNOWN') {
    update_data['country'] = req.body.country;
  }
  if(req.body.label > 0) {
    update_data['grouplabel'] = req.body.label;
  }
  const trackings = [];
  req.body.records.forEach((entry) => {
    trackings.push(entry.id);
  });
  Tracking.update(update_data, {where: {tracking: trackings}})
    .then((result) => {
      Tracking.findAll({
        where: {lastchecked: update_data.lastchecked},
        attributes: [
          'tracking',
          'carrier',
          'country',
          'addeddate',
          'lastchecked',
          'status',
          'shippeddate',
          'delivereddate',
          'delivered',
          'grouplabel',
        ],
      })
        .then((result) => res.json(result))
        .catch((err) => console.log(err));
    })
      .catch((err) => console.log(err));
  
};

// Acquire all tracking data (exclude tracking history due to huge amount of data)
exports.get_all = (req, res) => {
  Tracking.findAll({
    attributes: [
      'tracking',
      'carrier',
      'country',
      'addeddate',
      'lastchecked',
      'status',
      'shippeddate',
      'delivereddate',
      'delivered',
      'grouplabel',
    ],
    where: {
      addeddate: {
        [Op.gt]: Date.now() - (183*24*60*60*1000),
      }
    }
  })
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};

// Update singel record
exports.update_tracking = (req, res) => {
  if(req.body.action) {
    const update_data = {};
    if (req.body.action.country.length > 0) {
      update_data['country'] = req.body.action.country;
    }
    if (req.body.action.carrier.length > 0) {
      update_data['carrier'] = req.body.action.carrier;
    }
    if (req.body.action.shippeddate.length > 0) {
      if (req.body.action.shippeddate == '0') {
        update_data['shippeddate'] = 0;
      } else if (req.body.action.shippeddate == '1') {
        update_data['shippeddate'] = 1;
      } else {
        const date_parts = req.body.action.shippeddate.split('-');
        const date = new Date(parseInt(date_parts[0]), parseInt(date_parts[1]) - 1, parseInt(date_parts[2]));
        update_data['shippeddate'] = date.getTime();
      }
    }
    if (req.body.action.delivereddate.length > 0) {
      if (req.body.action.delivereddate == '0') {
        update_data['delivereddate'] = 0;
      } else if (req.body.action.delivereddate == '1') {
        update_data['delivereddate'] = 1;
      } else {
        const date_parts = req.body.action.delivereddate.split('-');
        const date = new Date(parseInt(date_parts[0]), parseInt(date_parts[1]) - 1, parseInt(date_parts[2]));
        update_data['delivereddate'] = date.getTime();
      }
    }
    if (req.body.action.status.length > 0) {
      update_data['status'] = req.body.action.status;
    }
    update_data['delivered'] = req.body.action.delivered;

    Tracking.update(update_data, {where: {tracking: req.body.tracking}})
      .then(() => {
        Tracking.findAll({
          attributes: [
            'tracking',
            'carrier',
            'country',
            'addeddate',
            'lastchecked',
            'status',
            'shippeddate',
            'delivereddate',
            'delivered',
            'grouplabel',
          ],
          where: {tracking: req.body.tracking}
        })
          .then((result) => res.json(result))
          .catch((err) => console.log(err));
      })
      .catch((err) => console.log(err));
  } else {
    // Delete
    Tracking.destroy({where: {tracking: req.body.tracking}})
      .then((result) => res.json(result))
      .catch((err) => console.log(err));
  }
};

// Acquire all country names
exports.get_all_countries = (req, res) => {
  Countrylist.findAll({
    attributes: ['country_name', 'country_code', 'baseentry'],
  })
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};
// Add a new country name to DB
exports.addcountry = (req, res) => {
  let add_data = {
    country_name: req.body.country_name,
    country_code: req.body.country_code,
    baseentry: false,
  };
  Countrylist.create(add_data).then(() => {
    Countrylist.findAll({
      where: { country_name: req.body.country_name },
      attributes: ['country_name', 'country_code', 'baseentry'],
    })
      .then((result) => res.json(result))
      .catch((err) => console.log(err));
  });
};

// Acquire all data on available shipping methods by country
exports.get_all_shippings = (req, res) => {
  Country.findAll()
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};
// Update available shipping methods for country
exports.update_shipping = (req, res) => {
  const [method, country] = req.body.shipping.this_id.split('_');

  const update_data = {};
  update_data[`${method}_available`] = parseInt(req.body.shipping.value);

  Country.update(update_data, { where: { country_name: country } })
    .then(() => {
      Country.findAll({ where: { country_name: country } })
        .then((result) => res.json(result))
        .catch((err) => console.log(err));
    })
    .catch((err) => console.log(err));
};

// Acquire all group labels
exports.get_all_grouplabels = (req, res) => {
  Grouplabel.findAll()
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};
// Add a new group label to DB
exports.addgrouplabel = (req, res) => {
  let add_data = { label: req.body.label };
  Grouplabel.create(add_data).then(() => {
    Grouplabel.findAll({
      where: { label: req.body.label },
    })
      .then((result) => res.json(result))
      .catch((err) => console.log(err));
  });
};

// Acquire saved tracking history
exports.acquire_tracking_data = (req, res) => {
  Tracking.findAll({ where: { tracking: req.query.tracking } })
    .then((result) => result.length >= 1 ? res.json(result[0].data) : res.json({error: 'No data...'}))
    .catch((err) => console.log(err));
};
exports.acquire_tracking_data_batch = (req, res) => {
  Tracking.findAll({ where: { delivered: 0, grouplabel: req.query.grouplabel } })
    .then((result) => res.json(result))
    .catch((err) => console.log(err));
};

// Runtime log
exports.get_log = (req, res) => {
  res.json(GetLog());
};

exports.errorcheck = (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).send('No files were uploaded.');
  }

  // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
  let sampleFile = req.files.file;

  // Use the mv() method to place the file somewhere on your server
  // sampleFile.mv('./uploads/file.csv', function(err) {
  //   if (err)
  //     return res.status(500).send(err);
  //   csvtojson().fromString(sampleFile.data.toString()).then(data => { 
  //       console.log(data);
  //     });
  //   res.json({ status: 'OK' });
  // });

const state_hash =  {
    'AL': 'Alabama',
    'AK': 'Alaska',
    'AS': 'American Samoa',
    'AZ': 'Arizona',
    'AR': 'Arkansas',
    'CA': 'California',
    'CO': 'Colorado',
    'CT': 'Connecticut',
    'DE': 'Delaware',
    'DC': 'District Of Columbia',
    'FM': 'Federated States Of Micronesia',
    'FL': 'Florida',
    'GA': 'Georgia',
    'GU': 'Guam',
    'HI': 'Hawaii',
    'ID': 'Idaho',
    'IL': 'Illinois',
    'IN': 'Indiana',
    'IA': 'Iowa',
    'KS': 'Kansas',
    'KY': 'Kentucky',
    'LA': 'Louisiana',
    'ME': 'Maine',
    'MH': 'Marshall Islands',
    'MD': 'Maryland',
    'MA': 'Massachusetts',
    'MI': 'Michigan',
    'MN': 'Minnesota',
    'MS': 'Mississippi',
    'MO': 'Missouri',
    'MT': 'Montana',
    'NE': 'Nebraska',
    'NV': 'Nevada',
    'NH': 'New Hampshire',
    'NJ': 'New Jersey',
    'NM': 'New Mexico',
    'NY': 'New York',
    'NC': 'North Carolina',
    'ND': 'North Dakota',
    'MP': 'Northern Mariana Islands',
    'OH': 'Ohio',
    'OK': 'Oklahoma',
    'OR': 'Oregon',
    'PW': 'Palau',
    'PA': 'Pennsylvania',
    'PR': 'Puerto Rico',
    'RI': 'Rhode Island',
    'SC': 'South Carolina',
    'SD': 'South Dakota',
    'TN': 'Tennessee',
    'TX': 'Texas',
    'UT': 'Utah',
    'VT': 'Vermont',
    'VI': 'Virgin Islands',
    'VA': 'Virginia',
    'WA': 'Washington',
    'WV': 'West Virginia',
    'WI': 'Wisconsin',
    'WY': 'Wyoming'
  };
  const states_hash =
  {
    'ALABAMA': 'AL',
    'ALASKA': 'AK',
    'AMERICAN SAMOA': 'AS',
    'ARIZONA': 'AZ',
    'ARKANSAS': 'AR',
    'CALIFORNIA': 'CA',
    'COLORADO': 'CO',
    'CONNECTICUT': 'CT',
    'DELAWARE': 'DE',
    'DISTRICT OF COLUMBIA': 'DC',
    'FEDERATED STATES OF MICRONESIA': 'FM',
    'FLORIDA': 'FL',
    'GEORGIA': 'GA',
    'GUAM': 'GU',
    'HAWAII': 'HI',
    'IDAHO': 'ID',
    'ILLINOIS': 'IL',
    'INDIANA': 'IN',
    'IOWA': 'IA',
    'KANSAS': 'KS',
    'KENTUCKY': 'KY',
    'LOUISIANA': 'LA',
    'MAINE': 'ME',
    'MARSHALL ISLANDS': 'MH',
    'MARYLAND': 'MD',
    'MASSACHUSETTS': 'MA',
    'MICHIGAN': 'MI',
    'MINNESOTA': 'MN',
    'MISSISSIPPI': 'MS',
    'MISSOURI': 'MO',
    'MONTANA': 'MT',
    'NEBRASKA': 'NE',
    'NEVADA': 'NV',
    'NEW HAMPSHIRE': 'NH',
    'NEW JERESY': 'NJ',
    'NEW MEXICO': 'NM',
    'NEW YORK': 'NY',
    'NORTH CAROLINA': 'NC',
    'NORTH DAKOTA': 'ND',
    'NORTHERN MARIANA ISLANDS': 'MP',
    'OHIO': 'OH',
    'OKLAHOMA': 'OK',
    'OREGANO': 'OR',
    'PALAU': 'PW',
    'PENNSYLVANIA': 'PA',
    'PUERTO RICO': 'PR',
    'RHODE ISLAND': 'RI',
    'SOUTH CAROLINA': 'SC',
    'SOUTH DAKOTA': 'SD',
    'TENNESSEE': 'TN',
    'TEXAS': 'TX',
    'UTAH': 'UT',
    'VERMONT': 'VT',
    'VIRGIN ISLANDS': 'VI',
    'VIRGINIA': 'VA',
    'WASHINGTON': 'WA',
    'WEST VIRGINIA': 'WV',
    'WISCONSIN': 'WI',
    'WYOMING': 'WY'
  };

  csvtojson().fromString(sampleFile.data.toString()).then(data => {
    const trackings = [];
    data.forEach(d => trackings.push(d['Tracking Number']));

    Tracking.findAll({ attributes: [ 'tracking', 'status', 'delivered' ], where: { tracking: trackings } })
      .then((result) => {
        const output = {
          unavailable: trackings.length - result.length,
          summary_delivered: {
            no_match: 0,
            same_state: 0,
            same_city: 0,
            same_zip: 0,
          },
          results: []
        };
        result.forEach(entry => {
          const index = trackings.indexOf(entry.tracking);
          const out = {
            Tracking: entry.tracking
          };
          let no_match = true;
          if (entry.delivered) {
            let zip_code = data[index]['Postal_Code'];
            if (zip_code.length > 5) {
              zip_code = zip_code.split('-')[0];
            }
            if (entry.status.indexOf(zip_code) >= 0) {
              output.summary_delivered.same_zip++;
              out['ZIP'] = 'OK';
              no_match = false;
            } else {
              out['ZIP'] = 'NG';
            }
            if (entry.status.indexOf(data[index]['City'].toUpperCase()) >= 0) {
              output.summary_delivered.same_city++;
              out['City'] = 'OK';
              no_match = false;
            } else {
              out['City'] = 'NG';
            }
            let state_name = data[index]['State_Province'].toUpperCase();
            if (state_name.length != 2) {
              state_name = states_hash[state_name];
            }
            if (entry.status.indexOf(state_name) >= 0) {
              output.summary_delivered.same_state++;
              out['State'] = 'OK';
              no_match = false;
            } else {
              out['State'] = 'NG';
            }
            if (no_match) {
              output.summary_delivered.no_match++;
            }
            out['Status'] = entry.status;
            out['Addressed_to'] = {
              State: data[index]['State_Province'],
              City: data[index]['City'],
              ZIP: data[index]['Postal_Code'],
            };
          } else {
            out['Status'] = 'In shipment...';
          }
          if (no_match && out['Status'] != 'In shipment...') {
            output.results.unshift(out);
          } else {
            output.results.push(out);
          }
        });
        res.json({ status: 'OK', output });
      })
      .catch((err) => console.log(err));
  });
};

/********************/
/* Helper functions */
/********************/
function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
