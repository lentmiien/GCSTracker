function Select(range) {
  const start_date = document.getElementById('range_start');
  const end_date = document.getElementById('range_end');
  const d = new Date();

  let sd = start_date.value;
  let ed = end_date.value;

  switch (range) {
    case 'sevendays':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 7));
      ed = dateToString(d);
      break;
    case 'thirtydays':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 30));
      ed = dateToString(d);
      break;
    case 'ninthydays':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth(), d.getDate() - 90));
      ed = dateToString(d);
      break;
    case 'thismonth':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth(), 1));
      ed = dateToString(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      break;
    case 'lastmonth':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth() - 1, 1));
      ed = dateToString(new Date(d.getFullYear(), d.getMonth(), 0));
      break;
    case 'lastlastmonth':
      sd = dateToString(new Date(d.getFullYear(), d.getMonth() - 2, 1));
      ed = dateToString(new Date(d.getFullYear(), d.getMonth() - 1, 0));
      break;
  }

  start_date.value = sd;
  end_date.value = ed;
}

function Custom() {
  document.getElementById('custom').checked = true;

  const start_date = document.getElementById('range_start');
  const end_date = document.getElementById('range_end');

  let sd = start_date.value;
  let ed = end_date.value;

  // Swap values if provided in the incorrect order
  if (sd > ed) {
    start_date.value = ed;
    end_date.value = sd;
  }
}

function dateToString(date) {
  return `${date.getFullYear()}-${date.getMonth() > 8 ? date.getMonth() + 1 : '0' + (date.getMonth() + 1)}-${
    date.getDate() > 9 ? date.getDate() : '0' + date.getDate()
  }`;
}
