const track_progress = document.getElementById('track_progress');
const tracked_records = document.getElementById('tracked_records');
const jp_s_records = document.getElementById('jp_s_records');
const dhl_s_records = document.getElementById('dhl_s_records');
const usps_a_records = document.getElementById('usps_a_records');
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
  tracked_records.innerHTML = `<b>${data.last_tracked.count} (${data.last_tracked.date})</b>`;
  jp_s_records.innerHTML = `<b>${data.JP_scraping_counter.count}</b>(${data.JP_scraping_counter.done}%) <i style="color:${
    data.JP_scraping_counter.html.status == 200 ? 'green' : 'red'
  };">[${data.JP_scraping_counter.html.status}:${data.JP_scraping_counter.html.text}]</i>`;
  dhl_s_records.innerHTML = `<b>${data.DHL_scraping_counter.count}</b>(${data.DHL_scraping_counter.done}%) <i style="color:${
    data.DHL_scraping_counter.html.status == 200 ? 'green' : 'red'
  };">[${data.DHL_scraping_counter.html.status}:${data.DHL_scraping_counter.html.text}]</i>`;
  usps_a_records.innerHTML = `<b>${data.USPS_API_counter.count}</b>(${data.USPS_API_counter.done}%) <i style="color:${
    data.USPS_API_counter.html.status == 200 ? 'green' : 'red'
  };">[${data.USPS_API_counter.html.status}:${data.USPS_API_counter.html.text}]</i>`;
  dhl_a_records.innerHTML = `<b>${data.DHL_API_counter.count}/250</b>(${data.DHL_API_counter.done}%) <i style="color:${
    data.DHL_API_counter.html.status == 200 ? 'green' : 'red'
  };">[${data.DHL_API_counter.html.status}:${data.DHL_API_counter.html.text}]</i>`;

  // Re-run periodically every 5s
  setTimeout(Updatedata, 5000);
}

// Start initial update
Updatedata();
