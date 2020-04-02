async function ReportAPI() {
  const lost = document.getElementById('lost').value.split('\n');
  const delivered = document.getElementById('delivered').value.split('\n');
  const returned = document.getElementById('returned').value.split('\n');

  // req.body = {
  //   lost: [ 'rec1', 'rec2', 'rec3' ],
  //   delivered: [ 'rec4', 'rec8', 'rec9' ],
  //   returned: [ 'rec5', 'rec6', 'rec7' ]
  // }

  const response = await fetch('/api/report', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ lost, delivered, returned })
  });
  const data = await response.json();

  document.getElementById('lost').value = JSON.stringify(data, null, 2);
  document.getElementById('delivered').value = '';
  document.getElementById('returned').value = '';
}
