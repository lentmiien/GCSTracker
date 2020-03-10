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
      // DHL scrapping
      // Try to acquire destination country
      // Acquire last tracking update
      // Acquire shipped date
      // Try to acquire delivered date
      // Save raw data
    }
  }

  return output;
};

module.exports = getResults;
