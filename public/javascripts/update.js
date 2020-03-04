async function Updatedata() {
  const add_progress = document.getElementById('add_progress');
  const track_progress = document.getElementById('track_progress');

  // fetch post data to server endpoint
  const response = await fetch('/mypage/progress', {
    method: 'GET',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json'
    }
  });
  const data = await response.json();

  // Update results
  if (data.add_progress == -1) {
    add_progress.innerHTML = '<i>Press "Add records" to start</i>';
  } else {
    add_progress.innerHTML = `<b>${Math.round(data.add_progress * 10000) / 100}%</b>`;
  }
  if (data.track_progress == -1) {
    track_progress.innerHTML = '<i>Press "Start tracking" to start</i>';
  } else {
    track_progress.innerHTML = `<b>${Math.round(data.track_progress * 10000) / 100}%</b>`;
  }

  // Re-run periodically every 5s
  setTimeout(Updatedata, 5000);
}

// Start initial update
Updatedata();
