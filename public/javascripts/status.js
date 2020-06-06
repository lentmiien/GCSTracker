async function AddToCountryList(element, country_name) {
  const country_code = element.parentNode.getElementsByTagName('select')[0].value;

  fetch('/mypage/addcl', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      country_name,
      country_code,
    }),
  });

  // Delete input controls
  element.parentNode.innerHTML = '';
}
