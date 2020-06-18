function StatusColor(status) {
  if (status == 0) {
    return 'rgb(173,173,173)';
  } else if (status == 1) {
    return 'rgb(73,173,73)';
  } else if (status == 2) {
    return 'rgb(173,73,73)';
  } else if (status == 3) {
    return 'rgb(73,73,173)';
  } else {
    return 'rgb(173,73,173)';
  }
}

async function Update(element, country_code, method) {
  const status = element.value;
  element.style.backgroundColor = 'yellow';
  fetch('/country/update', {
    method: 'post',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      country_code,
      method,
      status: parseInt(status),
    }),
  }).then((response) => {
    response.json().then((data) => {
      console.log(data);
      if (data.status == 'OK') {
        element.style.backgroundColor = StatusColor(status);
      }
    });
  });
}
