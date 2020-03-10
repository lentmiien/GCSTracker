const axios = require('axios');

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
      const data = { error: true, HTML_status: '', HTML_statusText: '' };
      if (error.response == undefined) {
        data.HTML_status = error.errno;
        data.HTML_statusText = error.errno;
      } else {
        data.HTML_status = error.response.status;
        data.HTML_statusText = error.response.statusText;
      }
    });
  return data;
  // const result = await axios.get(siteUrl, {
  //   headers: {
  //     accept: 'application/json',
  //     'DHL-API-Key': process.env.DHL_API_KEY
  //   }
  // });
  // result.data['HTML_status'] = result.status;
  // result.data['HTML_statusText'] = result.statusText;
  // return result.data;
};

const getResultsAPI = async (siteUrl, carrier) => {
  const data = await fetchData(siteUrl);
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
      // Acquire last tracking update
      // Acquire shipped date
      // Try to acquire delivered date
      // Save raw data
    } else {
      // DHL tracking
      // Try to acquire destination country
      const ad = data.shipments[0].destination.address.addressLocality.split(' - ');
      output['country'] = ad[ad.length - 1];
      // Acquire last tracking update
      output['status'] = data.shipments[0].status.statusCode;
      // Acquire shipped date
      data.shipments[0].events.forEach(event => {
        if (event.description == 'Shipment picked up') {
          output['shippeddate'] = event.timestamp.split('T')[0];
        }
      });
      // Try to acquire delivered date
      output['delivered'] = '';
      if (data.shipments[0].status.statusCode == 'delivered') {
        output['delivered'] = data.shipments[0].status.timestamp.split('T')[0];
      }
      // Save raw data
      output['rawdata'] = JSON.stringify(data);
    }
  }

  return output;
};

module.exports = getResultsAPI;
