const axios = require('axios');

const fetchData = async siteUrl => {
  const result = await axios.get(siteUrl, {
    headers: {
      accept: 'application/json',
      'DHL-API-Key': process.env.DHL_API_KEY
    }
  });
  return result.data;
};

const getResultsAPI = async (siteUrl, carrier) => {
  const data = await fetchData(siteUrl);
  const output = {};

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
    const ad = data.shipments[0].destination.address.addressLocality.split(' ');
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

  return output;
};

module.exports = getResultsAPI;
