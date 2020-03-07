const track_progress = document.getElementById('track_progress');
const tracked_records = document.getElementById('tracked_records');
const jp_s_records = document.getElementById('jp_s_records');
const dhl_s_records = document.getElementById('dhl_s_records');
const dhl_a_records = document.getElementById('dhl_a_records');

async function Updatedata() {
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
  if (data.track_progress == -1) {
    track_progress.innerHTML = '<i>Press "Start tracking" to start</i>';
  } else {
    track_progress.innerHTML = `<b>${Math.round(data.track_progress * 10000) / 100}%</b>`;
  }
  tracked_records.innerHTML = `<b>${data.last_tracked.count} (${data.last_tracked.date})</b>`;
  jp_s_records.innerHTML = `<b>${data.JP_scraping_counter.count} (${data.JP_scraping_counter.current_date})</b>`;
  dhl_s_records.innerHTML = `<b>${data.DHL_scraping_counter.count} (${data.DHL_scraping_counter.current_date})</b>`;
  dhl_a_records.innerHTML = `<b>${data.DHL_API_counter.count}/250 (${data.DHL_API_counter.current_date})</b>`;

  // Re-run periodically every 5s
  setTimeout(Updatedata, 5000);
}

// Start initial update
Updatedata();
