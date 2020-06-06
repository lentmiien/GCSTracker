// Require used packages

// Require necessary database models
const { Country, Countrylist, Tracking, Op } = require('../sequelize');

//---------------------------------------------//
// exports.endpoints = (req, res, next) => {}; //
//---------------------------------------------//

exports.rank = async (req, res, next) => {
  const delay_ranking = [];

  // Only calculate ranking if a logged in user
  if (req.user) {
    const cdata = await Country.findAll();
    cdata.forEach((data) => {
      if (data.ems_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'EMS',
          delay: Math.round((100 * data.ems_averagetime) / data.ems_totalaveragetime) / 100,
          small_sample: data.ems_small_sample,
        });
      }
      if (data.airsp_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'ASP',
          delay: Math.round((100 * data.airsp_averagetime) / data.airsp_totalaveragetime) / 100,
          small_sample: data.airsp_small_sample,
        });
      }
      if (data.salspr_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'SAL Reg.',
          delay: Math.round((100 * data.salspr_averagetime) / data.salspr_totalaveragetime) / 100,
          small_sample: data.salspr_small_sample,
        });
      }
      if (data.salp_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'SAL Parcel',
          delay: Math.round((100 * data.salp_averagetime) / data.salp_totalaveragetime) / 100,
          small_sample: data.salp_small_sample,
        });
      }
      if (data.dhl_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'DHL',
          delay: Math.round((100 * data.dhl_averagetime) / data.dhl_totalaveragetime) / 100,
          small_sample: data.dhl_small_sample,
        });
      }
      if (data.airp_averagetime > 0) {
        delay_ranking.push({
          country: data.country_name,
          method: 'Air Parcel',
          delay: Math.round((100 * data.airp_averagetime) / data.airp_totalaveragetime) / 100,
          small_sample: data.airp_small_sample,
        });
      }
    });
  }

  // Sort by delay value
  delay_ranking.sort((a, b) => {
    if (a.delay > b.delay) {
      return -1;
    } else if (a.delay < b.delay) {
      return 1;
    } else {
      return 0;
    }
  });

  res.render('rank', { delay_ranking });
};

exports.update_page = (req, res) => {
  Country.findAll().then((results) => {
    res.render('update', { countries: results });
  });
};
exports.update_value = (req, res) => {
  let update_data = {};
  update_data[`${req.body.method}_available`] = req.body.status;
  Country.update(update_data, { where: { country_code: req.body.country_code } })
    .then(() => {
      res.json({ status: 'OK' });
    })
    .catch(() => {
      res.json({ status: 'FAILED' });
    });
};

exports.bulkupdate = (req, res) => {
  if (req.method == 'GET') {
    return res.render('bulkupdate');
  } else {
    const content = req.body.content.split('\n');
    content.forEach((row) => {
      if (row.length > 1) {
        const cols = row.split('\t');
        const update_data = {
          ems_available: 1,
          airsp_available: 1,
          salspr_available: 1,
          salspu_available: 1,
          salp_available: 1,
          dhl_available: 1,
          airp_available: 1,
        };

        // Zones
        if (cols[4].indexOf('SAL不可地域') == 0) {
          update_data.salspr_available = 0;
          update_data.salspu_available = 0;
        }
        if (cols[5].indexOf('SAL不可地域') == 0) {
          update_data.salp_available = 0;
        }
        if (cols[6].indexOf('AIR不可地域') == 0) {
          update_data.airsp_available = 0;
        }
        if (cols[7].indexOf('AirParcel不可地域') == 0) {
          update_data.airp_available = 0;
        }
        if (cols[8].indexOf('EMS不可地域') == 0) {
          update_data.ems_available = 0;
        }
        if (cols[9].indexOf('DHL不可地域') == 0) {
          update_data.dhl_available = 0;
        }

        // Exceptions
        if (cols[1] == 1) {
          // EMS/Air temporarily suspended
          if (update_data.ems_available == 1) {
            update_data.ems_available = 2;
          }
          if (update_data.airsp_available == 1) {
            update_data.airsp_available = 2;
          }
          if (update_data.airp_available == 1) {
            update_data.airp_available = 2;
          }
        }
        if (cols[2] == 1) {
          // DHL temporarily suspended
          if (update_data.dhl_available == 1) {
            update_data.dhl_available = 2;
          }
        }
        if (cols[3] == 1) {
          // SAL Reg. unavailable
          update_data.salspr_available = 0;
        }

        // SAL suspended
        if (update_data.salspr_available == 1) {
          update_data.salspr_available = 2;
        }
        if (update_data.salspu_available == 1) {
          update_data.salspu_available = 2;
        }
        if (update_data.salp_available == 1) {
          update_data.salp_available = 2;
        }

        // Clear space at end
        let countryname = cols[0];
        if (countryname.charAt(countryname.length - 1) == ' ') {
          countryname = countryname.slice(0, countryname.length - 1);
        }

        // Update database
        Country.update(update_data, { where: { country_name: countryname } });
      }
    });

    /*
英語略称                  Country name
一時引受停止_日本郵便      EMS/Air temporarily suspended   [1 = suspended]
一時引受停止_DHL           DHL temporarily suspended       [1 = suspended]
SalRegistered不可国       SAL Reg. unavailable             [1 = unavailable]
SmallPacket地域帯         SAL Reg./Unreg. zone             [SAL不可地域 = unavailable, or zone id (ex. SAL_ZONE1)]
SALParcel地域帯           SAL Parcel zone                  [SAL不可地域 = unavailable, or zone id (ex. Parcel_ZONE3)]
AIR地域帯                 ASP zone                         [AIR不可地域 = unavailable, or zone id (ex. AIR_ZONE2)]
AirParcel地域帯           Air Parcel zone                  [AirParcel不可地域 = unavailable, or zone id (ex. Parcel_ZONE1)]
EMS地域帯                 EMS zone                         [EMS不可地域 = unavailable, or zone id (ex. 2-1オセアニア・北米・中米・中近東)]
DHL地域帯                 DHL zone                         [DHL不可地域 = unavailable, or zone id (ex. DHL9_アフリカ・中東)]
    */
    return res.redirect('/country');
  }
};

// Calculate average shipping times
exports.recalculate = async (req, res) => {
  //const countries = await Country.findAll();
  const countrylist = await Countrylist.findAll();
  const countrylist_base = countrylist.filter((a) => a.baseentry);
  const trackings = await Tracking.findAll();

  // Create country code lookup table
  cc_lookup = {};
  countrylist.forEach((ce) => {
    cc_lookup[ce.country_name] = ce.country_code;
  });

  // Last 2 weeks
  const l2w = Date.now() - 1209600000;

  // Calculate averages
  const unknown_countries = [];
  const averages = {};
  trackings.forEach((t) => {
    if (cc_lookup[t.country]) {
      const cc = cc_lookup[t.country];
      if (t.delivereddate > t.shippeddate) {
        // Create entry if not existing
        if (!averages[cc]) {
          averages[cc] = {
            ems_2week_days: 0,
            ems_2week_cnt: 0,
            ems_days: 0,
            ems_cnt: 0,
            ems_shippeddate: 0,
            airsp_2week_days: 0,
            airsp_2week_cnt: 0,
            airsp_days: 0,
            airsp_cnt: 0,
            airsp_shippeddate: 0,
            salspr_2week_days: 0,
            salspr_2week_cnt: 0,
            salspr_days: 0,
            salspr_cnt: 0,
            salspr_shippeddate: 0,
            salspu_2week_days: 0,
            salspu_2week_cnt: 0,
            salspu_days: 0,
            salspu_cnt: 0,
            salspu_shippeddate: 0,
            salp_2week_days: 0,
            salp_2week_cnt: 0,
            salp_days: 0,
            salp_cnt: 0,
            salp_shippeddate: 0,
            dhl_2week_days: 0,
            dhl_2week_cnt: 0,
            dhl_days: 0,
            dhl_cnt: 0,
            dhl_shippeddate: 0,
            airp_2week_days: 0,
            airp_2week_cnt: 0,
            airp_days: 0,
            airp_cnt: 0,
            airp_shippeddate: 0,
          };
        }

        // Add data (TODO: change to use "method" when implemented)
        if (t.carrier == 'DHL') {
          if (t.delivereddate > l2w) {
            averages[cc].dhl_2week_cnt++;
            averages[cc].dhl_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          }
          averages[cc].dhl_cnt++;
          averages[cc].dhl_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);

          if (t.shippeddate > averages[cc].dhl_shippeddate) {
            averages[cc].dhl_shippeddate = t.shippeddate;
          }
        } else if (t.tracking.indexOf('EM') == 0) {
          if (t.delivereddate > l2w) {
            averages[cc].ems_2week_cnt++;
            averages[cc].ems_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          }
          averages[cc].ems_cnt++;
          averages[cc].ems_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);

          if (t.shippeddate > averages[cc].ems_shippeddate) {
            averages[cc].ems_shippeddate = t.shippeddate;
          }
        } else if (t.tracking.indexOf('RM') == 0) {
          // TEMPORARY: do not know which so add to both
          if (t.delivereddate > l2w) {
            averages[cc].airsp_2week_cnt++;
            averages[cc].salspr_2week_cnt++;
            averages[cc].airsp_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
            averages[cc].salspr_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          }
          averages[cc].airsp_cnt++;
          averages[cc].salspr_cnt++;
          averages[cc].airsp_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          averages[cc].salspr_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);

          if (t.shippeddate > averages[cc].airsp_shippeddate) {
            averages[cc].airsp_shippeddate = t.shippeddate;
            averages[cc].salspr_shippeddate = t.shippeddate;
          }
        } else if (t.tracking.indexOf('CC') == 0) {
          // TEMPORARY: do not know which so add to both
          if (t.delivereddate > l2w) {
            averages[cc].airp_2week_cnt++;
            averages[cc].salp_2week_cnt++;
            averages[cc].airp_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
            averages[cc].salp_2week_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          }
          averages[cc].airp_cnt++;
          averages[cc].salp_cnt++;
          averages[cc].airp_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);
          averages[cc].salp_days += (t.delivereddate - t.shippeddate) / (1000 * 60 * 60 * 24);

          if (t.shippeddate > averages[cc].airp_shippeddate) {
            averages[cc].airp_shippeddate = t.shippeddate;
            averages[cc].salp_shippeddate = t.shippeddate;
          }
        }
      }
    } else {
      let new_country = true;
      for (let ci = 0; ci < unknown_countries.length && new_country; ci++) {
        if (unknown_countries[ci] == t.country) {
          new_country = false;
        }
      }
      if (new_country) {
        unknown_countries.push(t.country);
      }
    }
  });

  // Update database
  for (let key of Object.keys(averages)) {
    const update_values = {
      ems_small_sample: averages[key].ems_2week_cnt > 0 && averages[key].ems_2week_cnt < 5,
      ems_averagetime: averages[key].ems_2week_days / (averages[key].ems_2week_cnt > 0 ? averages[key].ems_2week_cnt : 1),
      ems_totalaveragetime: averages[key].ems_days / (averages[key].ems_cnt > 0 ? averages[key].ems_cnt : 1),
      ems_lastsucessfullyshipped: averages[key].ems_shippeddate,

      airsp_small_sample: averages[key].airsp_2week_cnt > 0 && averages[key].airsp_2week_cnt < 5,
      airsp_averagetime: averages[key].airsp_2week_days / (averages[key].airsp_2week_cnt > 0 ? averages[key].airsp_2week_cnt : 1),
      airsp_totalaveragetime: averages[key].airsp_days / (averages[key].airsp_cnt > 0 ? averages[key].airsp_cnt : 1),
      airsp_lastsucessfullyshipped: averages[key].airsp_shippeddate,

      salspr_small_sample: averages[key].salspr_2week_cnt > 0 && averages[key].salspr_2week_cnt < 5,
      salspr_averagetime: averages[key].salspr_2week_days / (averages[key].salspr_2week_cnt > 0 ? averages[key].salspr_2week_cnt : 1),
      salspr_totalaveragetime: averages[key].salspr_days / (averages[key].salspr_cnt > 0 ? averages[key].salspr_cnt : 1),
      salspr_lastsucessfullyshipped: averages[key].salspr_shippeddate,

      salspu_small_sample: averages[key].salspu_2week_cnt > 0 && averages[key].salspu_2week_cnt < 5,
      salspu_averagetime: averages[key].salspu_2week_days / (averages[key].salspu_2week_cnt > 0 ? averages[key].salspu_2week_cnt : 1),
      salspu_totalaveragetime: averages[key].salspu_days / (averages[key].salspu_cnt > 0 ? averages[key].salspu_cnt : 1),
      salspu_lastsucessfullyshipped: averages[key].salspu_shippeddate,

      salp_small_sample: averages[key].salp_2week_cnt > 0 && averages[key].salp_2week_cnt < 5,
      salp_averagetime: averages[key].salp_2week_days / (averages[key].salp_2week_cnt > 0 ? averages[key].salp_2week_cnt : 1),
      salp_totalaveragetime: averages[key].salp_days / (averages[key].salp_cnt > 0 ? averages[key].salp_cnt : 1),
      salp_lastsucessfullyshipped: averages[key].salp_shippeddate,

      dhl_small_sample: averages[key].dhl_2week_cnt > 0 && averages[key].dhl_2week_cnt < 5,
      dhl_averagetime: averages[key].dhl_2week_days / (averages[key].dhl_2week_cnt > 0 ? averages[key].dhl_2week_cnt : 1),
      dhl_totalaveragetime: averages[key].dhl_days / (averages[key].dhl_cnt > 0 ? averages[key].dhl_cnt : 1),
      dhl_lastsucessfullyshipped: averages[key].dhl_shippeddate,

      airp_small_sample: averages[key].airp_2week_cnt > 0 && averages[key].airp_2week_cnt < 5,
      airp_averagetime: averages[key].airp_2week_days / (averages[key].airp_2week_cnt > 0 ? averages[key].airp_2week_cnt : 1),
      airp_totalaveragetime: averages[key].airp_days / (averages[key].airp_cnt > 0 ? averages[key].airp_cnt : 1),
      airp_lastsucessfullyshipped: averages[key].airp_shippeddate,
    };
    Country.update(update_values, { where: { country_code: key } });
  }

  res.render('cstatus', { unknown_countries, countrylist_base });
};

exports.addcl = (req, res) => {
  let add_data = {
    country_name: req.body.country_name,
    country_code: req.body.country_code,
    baseentry: false,
  };
  Countrylist.create(add_data);
  res.json({ status: 'OK' });
};
