const logdata = {
  start: Date.now(),
  entries: [],
};

function Log(status, text) {
  logdata.entries.push({
    timestamp: Date.now(),
    status,
    text,
  });
}

function GetLog() {
  logdata.entries.sort((a, b) => {
    if (a.timestamp > b.timestamp) {
      return -1;
    } else if (a.timestamp < b.timestamp) {
      return 1;
    } else {
      return 0;
    }
  });

  return logdata;
}

module.exports = {
  Log,
  GetLog,
};
