/*****************************************/
// API test functions
/*****************************************/

// req.body = { records: [ 'rec1', 'rec2', 'rec3' ] }
async function post_test() {
  // fetch post data to server endpoint
  const response = await fetch('/api/add', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      records: ['rec1', 'rec2', 'rec3']
    })
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

async function get_test() {
  // fetch post data to server endpoint
  const response = await fetch('/api/get', {
    method: 'get',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}
