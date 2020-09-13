const axios = require('axios');
var parseString = require('xml2js').parseString;

// Runtime logger
const { Log } = require('./runlog');

const fetchData = async (siteUrl) => {
  let data = {};
  await axios
    .get(siteUrl, {
      headers: {
        accept: 'application/json',
        'DHL-API-Key': process.env.DHL_API_KEY,
      },
    })
    .then((response) => {
      response.data['error'] = false;
      response.data['HTML_status'] = response.status;
      response.data['HTML_statusText'] = response.statusText;
      data = response.data;
    })
    .catch((error) => {
      data = { error: true, HTML_status: '', HTML_statusText: '' };
      if (error.response == undefined) {
        data.HTML_status = error.errno;
        data.HTML_statusText = error.errno;
      } else {
        data.HTML_status = error.response.status;
        data.HTML_statusText = error.response.statusText;
      }
      error.config.headers['DHL-API-Key'] = '**********************';
      Log('DHL api error', JSON.stringify(error, null, 2));
    });
  return data;
};

const fetchDataUSPS = async (siteUrl) => {
  let data = {};
  await axios
    .get(siteUrl)
    .then((response) => {
      data['error'] = false;
      data['HTML_status'] = response.status;
      data['HTML_statusText'] = response.statusText;
      parseString(response.data, (err, result) => {
        if (err) {
          data = { error: true, HTML_status: 'XMLERROR', HTML_statusText: 'Failed parsing XML' };
          Log('USPS parse error', JSON.stringify({ err, result }, null, 2));
        } else {
          // Validate content of 'result'
          if (result.hasOwnProperty('TrackResponse') && result.TrackResponse.hasOwnProperty('TrackInfo')) {
            if (result.TrackResponse.TrackInfo[0].hasOwnProperty('TrackSummary')) {
              data['xml_json'] = result;
            } else if (result.TrackResponse.TrackInfo[0].hasOwnProperty('Error')) {
              data['error'] = true;
              data['HTML_status'] = 'Tracking unavailable';
              data['HTML_statusText'] = 'Tracking unavailable';
              Log('USPS Tracking unavailable error', JSON.stringify(result, null, 2));
            } else {
              data['error'] = true;
              data['HTML_status'] = 'Invalid format';
              data['HTML_statusText'] = 'Invalid format';
              Log('USPS Invalid format error', JSON.stringify(result, null, 2));
            }
          } else {
            data['error'] = true;
            data['HTML_status'] = 'Invalid format';
            data['HTML_statusText'] = 'Invalid format';
            Log('USPS Invalid format error', JSON.stringify(result, null, 2));
          }
        }
      });
    })
    .catch((error) => {
      data = { error: true, HTML_status: '', HTML_statusText: '' };
      if (error.response == undefined) {
        data.HTML_status = error.errno;
        data.HTML_statusText = error.errno;
      } else {
        data.HTML_status = error.response.status;
        data.HTML_statusText = error.response.statusText;
      }
      Log('USPS API error', JSON.stringify(error, null, 2));
    });
  return data;
};

let last_error = false;
const getResultsAPI = async (siteUrl, carrier) => {
  let data;
  if (carrier == 'DHL') {
    data = await fetchData(siteUrl);
  } else {
    data = await fetchDataUSPS(siteUrl);
  }
  const output = {
    HTML_status: data.HTML_status,
    HTML_statusText: data.HTML_statusText,
  };

  if (data.error == false) {
    last_error = false;

    if (carrier == 'JP') {
      // Japan Post tracking
      // Try to acquire destination country
      // Acquire last tracking update
      // Acquire shipped date
      // Try to acquire delivered date
      // Save raw data
    } else if (carrier == 'USPS') {
      // USPS tracking
      // Try to acquire destination country
      output['country'] = 'USA';
      // Acquire last tracking update
      output['status'] = data.xml_json.TrackResponse.TrackInfo[0].TrackSummary[0];
      // Acquire shipped date
      if (data.xml_json.TrackResponse.TrackInfo[0].TrackDetail) {
        data.xml_json.TrackResponse.TrackInfo[0].TrackDetail.forEach((event) => {
          if (event.indexOf('Acceptance,') == 0) {
            const data_parts = event.split(', ');
            const d = DateFormatter(`${data_parts[1]}, ${data_parts[2]}`).split('-');
            output['shippeddate'] = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), 12, 0).getTime();
          }
        });
      }
      // Try to acquire delivered date
      output['delivered'] = 0;
      if (output['status'].indexOf('Your item was delivered') == 0 || output['status'].indexOf('Your item has been delivered') == 0) {
        const _on_split = output['status'].split(' on ');
        const data_parts = _on_split[1].split(', ');
        const first_parts = data_parts[0].split(' ');
        const f_p_len = first_parts.length;
        const second_parts = data_parts[1].split(' ');
        const d = DateFormatter(`${first_parts[f_p_len - 2]} ${first_parts[f_p_len - 1]}, ${second_parts[0]}`).split('-');
        output['delivered'] = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), 12, 0).getTime();
      }
      // Save raw data
      const tracking_data = [
        {
          timestamp: output['delivered'],
          description: output['status'],
          location: 'USA',
        },
      ];
      if (data.xml_json.TrackResponse.TrackInfo[0].TrackDetail) {
        let last_ts = Date.now();
        data.xml_json.TrackResponse.TrackInfo[0].TrackDetail.forEach((event) => {
          last_ts = AquireTimestamp(event, last_ts);
          tracking_data.push({
            timestamp: last_ts,
            description: event,
            location: '---',
          });
        });
      }
      output['rawdata'] = JSON.stringify({ shipments: [{ events: tracking_data }] });
    } else {
      // DHL tracking
      // Try to acquire destination country
      if (data.shipments[0].destination) {
        const ad = data.shipments[0].destination.address.addressLocality.split(' - ');
        output['country'] = CountryNormalize(ad[ad.length - 1]);
        // Acquire last tracking update
        output['status'] = data.shipments[0].status.statusCode;
        // Acquire shipped date
        data.shipments[0].events.forEach((event) => {
          if (event.description == 'Shipment picked up' || event.description == 'Shipment scheduled to be picked up') {
            const sdt = event.timestamp.split('T');
            const d = sdt[0].split('-');
            const t = sdt[1].split(':');
            output['shippeddate'] = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), parseInt(t[0]), parseInt(d[1])).getTime();
          }
        });
        // Try to acquire delivered date
        output['delivered'] = 0;
        if (data.shipments[0].status.statusCode == 'delivered') {
          const sdt = data.shipments[0].status.timestamp.split('T');
          const d = sdt[0].split('-');
          const t = sdt[1].split(':');
          output['delivered'] = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), parseInt(t[0]), parseInt(d[1])).getTime();
        }
        // Save raw data
        output['rawdata'] = JSON.stringify(data);
      } else {
        // Return an 'INVALID' result
        output['country'] = 'JAPAN';
        output['carrier'] = 'INVALID';
        output['status'] = output.HTML_status;
        output['shippeddate'] = 0;
        output['delivered'] = 0;
        output.HTML_status = 200; // One 404 is OK, so change to 200 in return
      }
    }
  } else if (output.HTML_status == 404 && last_error == false) {
    last_error = true;
    // Cound not find any trackable record
    // Return an 'INVALID' result
    output['country'] = 'JAPAN';
    output['carrier'] = 'INVALID';
    output['status'] = output.HTML_status;
    output['shippeddate'] = 0;
    output['delivered'] = 0;
    output.HTML_status = 200; // One 404 is OK, so change to 200 in return
  } else {
    last_error = true;
    // Cound not find any trackable record
    // Return an 'INVALID' result
    output['country'] = 'JAPAN';
    output['carrier'] = 'INVALID';
    output['status'] = output.HTML_status;
    output['shippeddate'] = 0;
    output['delivered'] = 0;
  }

  return output;
};

function DateFormatter(in_date) {
  //March 10, 2020
  let temp = in_date.split(', ');
  let temp2 = temp[0].split(' ');
  const months = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
  };

  return `${temp[1]}-${months[temp2[0]]}-${temp2[1]}`;
}

const country_mapper = {
  'KOREA, REPUBLIC OF (SOUTH K.)': 'KOREA REP',
  'KOREA, REPUBLIC OF': 'KOREA REP',
  'NETHERLANDS, THE': 'NETHERLANDS',
  'PHILIPPINES, THE': 'PHILIPPINES',
  UK: 'UNITED KINGDOM',
  'VIET NAM': 'VIETNAM',
  "CHINA, PEOPLE'S REPUBLIC": 'CHINA',
  'CHINA MAINLAND': 'CHINA',
  MACAU: 'MACAO',
  東京都: 'JAPAN',
  'IRELAND, REPUBLIC OF': 'IRELAND',
  'CZECH REPUBLIC, THE': 'CZECH',
};

function CountryNormalize(in_name) {
  out_name = in_name.toUpperCase();
  if (country_mapper[out_name]) {
    return country_mapper[out_name];
  }
  return out_name;
}

function AquireTimestamp(event, last_ts) {
  // return millisecond timestamp for date in event text string
  // Valid string formats:
  //    ...at 11:27 am on June 16, 2020 in...
  //    ..., June 15, 2020, 3:38 pm, ...
  //    ..., 06/10/2020, 4:30 pm, ...  // month/date/year
  //    << no data >> -> use date from previous entry
  let year = 0,
    month,
    date,
    hour = 0,
    minute = 0;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Aquire date
  const short_date_index = event.indexOf('/');
  if (short_date_index > 0) {
    // 06/10/2020 // month/date/year
    year = parseInt(event.substring(short_date_index + 4, short_date_index + 8));
    month = parseInt(event.substring(short_date_index - 2, short_date_index));
    date = parseInt(event.substring(short_date_index + 1, short_date_index + 3));
  } else {
    months.forEach((m, i) => {
      const long_date_index = event.indexOf(m);
      if (long_date_index > 0) {
        // June 15, 2020
        year = parseInt(event.substring(long_date_index + m.length + 5, long_date_index + m.length + 9));
        year = year < 2000 ? year + 2000 : year;
        month = i;
        date = parseInt(event.substring(long_date_index + m.length + 1, long_date_index + m.length + 3));
      }
    });

    // If no valid date return last date
    if (year == 0) {
      return last_ts;
    }
  }

  // Aquire time
  let time_index = event.indexOf('am');
  let time_modifier = time_index == -1 ? 12 : 0;
  time_index = time_index == -1 ? event.indexOf('pm') : time_index;
  if (time_index > 0) {
    // 11:27 am
    const substrings = event.substring(time_index - 6, time_index - 1).split(':');
    const h_index = substrings[0].indexOf(' ');
    hour = h_index == -1 ? parseInt(substrings[0]) : parseInt(substrings[0].substring(h_index + 1, substrings[0].length));
    minute = parseInt(substrings[1]);
  }

  // Create and return timestamp
  return new Date(year, month, date, hour + time_modifier, minute).getTime();
}

module.exports = getResultsAPI;
