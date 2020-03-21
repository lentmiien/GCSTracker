const axios = require('axios');
var parseString = require('xml2js').parseString;

const fetchData = async siteUrl => {
  let data = {};
  await axios
    .get(siteUrl, {
      headers: {
        accept: 'application/json',
        'DHL-API-Key': process.env.DHL_API_KEY
      }
    })
    .then(response => {
      response.data['error'] = false;
      response.data['HTML_status'] = response.status;
      response.data['HTML_statusText'] = response.statusText;
      data = response.data;
    })
    .catch(error => {
      data = { error: true, HTML_status: '', HTML_statusText: '' };
      if (error.response == undefined) {
        data.HTML_status = error.errno;
        data.HTML_statusText = error.errno;
      } else {
        data.HTML_status = error.response.status;
        data.HTML_statusText = error.response.statusText;
      }
    });
  return data;
};

const fetchDataUSPS = async siteUrl => {
  let data = {};
  await axios
    .get(siteUrl)
    .then(response => {
      data['error'] = false;
      data['HTML_status'] = response.status;
      data['HTML_statusText'] = response.statusText;
      parseString(response.data, (err, result) => {
        if (err || result.Error) {
          data = { error: true, HTML_status: 'XMLERROR', HTML_statusText: 'Failed parsing XML' };
        } else {
          data['xml_json'] = result;
          //data = response.data;
        }
      });
    })
    .catch(error => {
      console.log(error);
      data = { error: true, HTML_status: '', HTML_statusText: '' };
      if (error.response == undefined) {
        data.HTML_status = error.errno;
        data.HTML_statusText = error.errno;
      } else {
        data.HTML_status = error.response.status;
        data.HTML_statusText = error.response.statusText;
      }
    });
  return data;
};

const getResultsAPI = async (siteUrl, carrier) => {
  let data;
  if (carrier == 'DHL') {
    data = await fetchData(siteUrl);
  } else {
    data = await fetchDataUSPS(siteUrl);
  }
  const output = {
    HTML_status: data.HTML_status,
    HTML_statusText: data.HTML_statusText
  };

  if (data.error == false) {
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
      data.xml_json.TrackResponse.TrackInfo[0].TrackDetail.forEach(event => {
        if (event.indexOf('Acceptance,') == 0) {
          const data_parts = event.split(', ');
          const d = DateFormatter(`${data_parts[1]}, ${data_parts[2]}`).split('-');
          output['shippeddate'] = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), 12, 0).getTime();
        }
      });
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
          location: 'USA'
        }
      ];
      data.xml_json.TrackResponse.TrackInfo[0].TrackDetail.forEach(event => {
        tracking_data.push({
          timestamp: Date.now(),
          description: event,
          location: '---'
        });
      });
      output['rawdata'] = JSON.stringify({ shipments: [{ events: tracking_data }] });
    } else {
      // DHL tracking
      // Try to acquire destination country
      const ad = data.shipments[0].destination.address.addressLocality.split(' - ');
      output['country'] = CountryNormalize(ad[ad.length - 1]);
      // Acquire last tracking update
      output['status'] = data.shipments[0].status.statusCode;
      // Acquire shipped date
      data.shipments[0].events.forEach(event => {
        if (event.description == 'Shipment picked up') {
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
    }
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
    December: '12'
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
  MACAU: 'MACAO',
  東京都: 'JAPAN',
  'IRELAND, REPUBLIC OF': 'IRELAND'
};
function CountryNormalize(in_name) {
  out_name = in_name.toUpperCase();
  if (country_mapper[out_name]) {
    return country_mapper[out_name];
  }
  return out_name;
}

module.exports = getResultsAPI;
