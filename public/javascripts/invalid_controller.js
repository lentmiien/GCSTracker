async function Invalid(id) {
  const response = await fetch(`/mypage/process_invalid/${id}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();
  if (data.status == 'OK') {
    document.getElementById(`btn${id}`).className = 'hidden';
    document.getElementById(`row${id}`).className = 'bg-danger';
  } else {
    document.getElementById(`row${id}`).className = 'bg-warning';
  }
}

async function Valid(id, carrier) {
  const response = await fetch(`/mypage/process_valid/${id}/${carrier}`, {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();
  if (data.status == 'OK') {
    document.getElementById(`btn${id}`).className = 'hidden';
    document.getElementById(`row${id}`).className = 'bg-success';
  } else {
    document.getElementById(`row${id}`).className = 'bg-warning';
  }
}
