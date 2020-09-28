const logdata = {
  start: Date.now(),
  tracking: {
    jp: {
      current: 0,
      total: 0,
      last: '',
    },
    dhl: {
      current: 0,
      total: 0,
      last: '',
    },
    usps: {
      current: 0,
      total: 0,
      last: '',
    },
  },
  entries: [],
};

function SetStatus(status) {
  if (status.jp) {
    logdata.tracking.jp.current = status.jp.current;
    logdata.tracking.jp.total = status.jp.total;
    logdata.tracking.jp.last = status.jp.last;
  }

  if (status.dhl) {
    logdata.tracking.dhl.current = status.dhl.current;
    logdata.tracking.dhl.total = status.dhl.total;
    logdata.tracking.dhl.last = status.dhl.last;
  }

  if (status.usps) {
    logdata.tracking.usps.current = status.usps.current;
    logdata.tracking.usps.total = status.usps.total;
    logdata.tracking.usps.last = status.usps.last;
  }
}

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
  SetStatus,
  Log,
  GetLog,
};
