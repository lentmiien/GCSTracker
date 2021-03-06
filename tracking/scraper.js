const cheerio = require('cheerio');
const axios = require('axios');

// Runtime logger
const { Log } = require('../runlog');

let HTML_status;
let HTML_statusText;

const fetchData = async (siteUrl) => {
  let data;
  await axios
    .get(siteUrl)
    .then((response) => {
      HTML_status = response.status;
      HTML_statusText = response.statusText;
      data = cheerio.load(response.data);
    })
    .catch((error) => {
      if (error.response == undefined) {
        HTML_status = error.errno;
        HTML_statusText = error.errno;
      } else {
        HTML_status = error.response.status;
        HTML_statusText = error.response.statusText;
      }
      data = undefined;
      Log('Scraping error', JSON.stringify({ url: siteUrl, error }, null, 2));
    });
  return data;
  // const result = await axios.get(siteUrl);
  // HTML_status = result.status;
  // HTML_statusText = result.statusText;
  // return cheerio.load(result.data);
};

const getResults = async (siteUrl, carrier) => {
  const $ = await fetchData(siteUrl);
  const output = {
    HTML_status: HTML_status,
    HTML_statusText: HTML_statusText,
  };

  if ($ != undefined) {
    if (carrier == 'JP') {
      const tracking_data = [];
      // Japan Post scrapping
      let date_index = -9;
      let date = '';
      let status = '';
      //let debug = []; // debugging#1
      $('td').each((index, element) => {
        const content = $(element).text();
        //debug.push(content); // debugging#1
        if (content.indexOf('/') == 2) {
          date_index = index;
          date = content.split(' ').join(':').split('/').join(':').split(':');
          date = new Date(
            parseInt(date[2]),
            parseInt(date[0]) - 1,
            parseInt(date[1]),
            date[3] ? parseInt(date[3]) : 12,
            date[4] ? parseInt(date[4]) : 0
          );
          date = date.getTime();
        }
        if (index - date_index == 1) {
          status = content;
        }
        if (index - date_index == 2) {
          if (content.length > 0 && content.indexOf(' ') != 0) {
            status += `＞${content}`;
          }
        }
        if (index - date_index == 4) {
          const country_data = content.split('  ');
          tracking_data.push({
            timestamp: date,
            description: status,
            location: country_data[0],
          });
        }
      });
      //Log('Debug', JSON.stringify(debug, null, 2)); // debugging#1
      if (tracking_data.length > 0) {
        // Try to acquire destination country
        output['country'] = '';
        for (let cnt = tracking_data.length - 1; cnt >= 0 && output['country'].length == 0; cnt--) {
          output['country'] = CountryNormalize(tracking_data[cnt].location);
        }
        if (output['country'] == 'USA') {
          output['carrier'] = 'USPS';
        }
        // Acquire last tracking update
        output['status'] = tracking_data[tracking_data.length - 1].description;
        // Acquire shipped date
        output['shippeddate'] = tracking_data[0].timestamp;
        // Try to acquire delivered date
        if (output['status'] == 'Final delivery') {
          output['delivered'] = tracking_data[tracking_data.length - 1].timestamp;
        } else {
          output['delivered'] = 0;
        }
      } else {
        // Cound not find any trackable record
        // Return an 'INVALID' result
        output['country'] = 'JAPAN';
        output['carrier'] = 'INVALID';
        output['status'] = 'No tracking';
        output['shippeddate'] = 0;
        output['delivered'] = 0;
      }
      // Save raw data
      output['rawdata'] = JSON.stringify({ shipments: [{ events: tracking_data }] });
    } else {
      // sample: https://www.dhl.com/cgi-bin/tracking.pl?AWB=1222865884
      const tracking = $('table')['1']['children'][1]['children'];
      const tracking_data = [];
      for (let i = 10; i < tracking.length - 1; i++) {
        const date = tracking[i]['children'][1]['children'][0]['children'][0].data;
        const time = tracking[i]['children'][5]['children'][0]['children'][0]['children'][0].data;
        const place = tracking[i]['children'][9]['children'][0]['children'][0].data;
        const status = tracking[i]['children'][13]['children'][0]['children'][0].data;
        const d = DateFormatter(date).split('-');
        const t = time.split(':');
        const ds = new Date(parseInt(d[0]), parseInt(d[1]) - 1, parseInt(d[2]), parseInt(t[0]), parseInt(t[1])).getTime();
        tracking_data.push({
          timestamp: ds,
          description: status,
          location: place.split(' - ')[1],
        });
      }
      // DHL scrapping
      if (tracking_data.length > 0) {
        // Try to acquire destination country
        output['country'] = '';
        for (let cnt = tracking_data.length - 1; cnt >= 0 && output['country'].length == 0; cnt--) {
          output['country'] = CountryNormalize(tracking_data[cnt].location);
        }
        // Acquire last tracking update
        output['status'] = tracking_data[tracking_data.length - 1].description;
        // Acquire shipped date
        output['shippeddate'] = tracking_data[0].timestamp;
        // Try to acquire delivered date
        if (output['status'] == 'Shipment delivered') {
          output['delivered'] = tracking_data[tracking_data.length - 1].timestamp;
        } else {
          output['delivered'] = 0;
        }
      } else {
        // Cound not find any trackable record
        // Return an 'INVALID' result
        output['country'] = 'JAPAN';
        output['carrier'] = 'INVALID';
        output['status'] = 'No tracking';
        output['shippeddate'] = 0;
        output['delivered'] = 0;
      }
      // Save raw data
      output['rawdata'] = JSON.stringify({ shipments: [{ events: tracking_data }] });
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

module.exports = getResults;
