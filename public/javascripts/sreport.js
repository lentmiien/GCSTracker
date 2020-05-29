// Search reporting functions

// Fetch - POST
async function Search() {
  const data = document.getElementById('tracking').value.split('\n');
  const response = fetch('/mypage/sreporting', {
    method: 'post',
    body: {
      data
    }
  });
  const json_report = await respons.json();
  document.getElementById('report_output').innerText = JSON.stringify(json_report, null, 2);
}