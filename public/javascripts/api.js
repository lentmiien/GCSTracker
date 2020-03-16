/*****************************************/
// API test functions
/*****************************************/

async function api_post() {
  const records = document.getElementById('tracking').value.split('\n');
  const date = document.getElementById('date').value.split('-');
  const d_timestamp = new Date(parseInt(date[0]), parseInt(date[1]) - 1, parseInt(date[2]), 12, 0).getTime();
  const response = await fetch('/api/add', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ records, date: d_timestamp })
  });
  const data = await response.json();
  document.getElementById('tracking').value = JSON.stringify(data, null, 2);
}

async function get_test(startdate, enddate) {
  // fetch post data to server endpoint
  const response = await fetch(`/api/get/${startdate}/${enddate}`, {
    method: 'get',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
