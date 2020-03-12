const cheerio = require('cheerio');
const axios = require('axios');

let HTML_status;
let HTML_statusText;

const fetchData = async siteUrl => {
  let data;
  await axios
    .get(siteUrl)
    .then(response => {
      HTML_status = response.status;
      HTML_statusText = response.statusText;
      data = cheerio.load(response.data);
    })
    .catch(error => {
      if (error.response == undefined) {
        HTML_status = error.errno;
        HTML_statusText = error.errno;
      } else {
        HTML_status = error.response.status;
        HTML_statusText = error.response.statusText;
      }
      data = undefined;
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
    HTML_statusText: HTML_statusText
  };

  if ($ != undefined) {
    if (carrier == 'JP') {
      const tracking_data = [];
      // Japan Post scrapping
      let date_index = -9;
      let date = '';
      let status = '';
      $('td').each((index, element) => {
        const content = $(element).text();
        if (content.indexOf('/') == 4) {
          date_index = index;
          date = content
            .split(' ')
            .join('T')
            .split('/')
            .join('-');
        }
        if (index - date_index == 1) {
          status = content;
        }
        if (index - date_index == 4) {
          tracking_data.push({
            timestamp: date,
            description: status,
            location: content
          });
        }
      });
      // Try to acquire destination country
      output['country'] = tracking_data[tracking_data.length - 1].location;
      // Acquire last tracking update
      output['status'] = tracking_data[tracking_data.length - 1].description;
      // Acquire shipped date
      output['shippeddate'] = tracking_data[0].timestamp.split('T')[0];
      // Try to acquire delivered date
      if (output['status'] == 'お届け済み') {
        output['delivered'] = tracking_data[tracking_data.length - 1].timestamp.split('T')[0];
      } else {
        output['delivered'] = '';
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
        tracking_data.push({
          timestamp: DateFormatter(date) + 'T' + time,
          description: status,
          location: place.split(' - ')[1]
        });
      }
      // DHL scrapping
      // Try to acquire destination country
      output['country'] = tracking_data[tracking_data.length - 1].location;
      // Acquire last tracking update
      output['status'] = tracking_data[tracking_data.length - 1].description;
      // Acquire shipped date
      output['shippeddate'] = tracking_data[0].timestamp.split('T')[0];
      // Try to acquire delivered date
      if (output['status'] == 'Shipment delivered') {
        output['delivered'] = tracking_data[tracking_data.length - 1].timestamp.split('T')[0];
      } else {
        output['delivered'] = '';
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
    December: '12'
  };

  return `${temp[1]}-${months[temp2[0]]}-${temp2[1]}`;
}

module.exports = getResults;
