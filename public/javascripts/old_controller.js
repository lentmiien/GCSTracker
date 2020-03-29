async function SetStatus(id, status) {
  const response = await fetch(`/mypage/old_set_status/${id}/${status}`, {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();
  if (data.status == 'OK') {
    document.getElementById(`btn${id}`).className = 'hidden';
    document.getElementById(`row${id}`).className = status == 'delete' ? 'bg-danger' : 'bg-success';
  } else {
    document.getElementById(`row${id}`).className = 'bg-warning';
  }
}
