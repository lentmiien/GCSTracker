// GLOBALS
let gdata;

// Search reporting functions

// Fetch - POST
async function Search() {
  const data = document.getElementById('tracking').value.split('\n');
  const response = await fetch('/mypage/sreporting', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ searchcontent: data }),
  });
  const json_report = await response.json();
  ProcessData(json_report);
}

async function CatSearch() {
  const date = document.getElementById('date').value.split('-');
  const day = document.getElementById('day').checked;
  const week = document.getElementById('week').checked;
  const month = document.getElementById('month').checked;
  const year = document.getElementById('year').checked;
  const ccode = document.getElementById('ccode').value;

  const year_v = parseInt(date[0]);
  const month_v = parseInt(date[1]) - 1;
  const date_v = parseInt(date[2]);
  const day_v = new Date(year_v, month_v, date_v).getDay();

  let start_ts;
  let end_ts;

  if (day) {
    start_ts = new Date(year_v, month_v, date_v, 0, 0, 0, 0).getTime();
    end_ts = new Date(year_v, month_v, date_v, 23, 59, 59, 999).getTime();
  } else if (week) {
    start_ts = new Date(year_v, month_v, date_v - day_v, 0, 0, 0, 0).getTime();
    end_ts = new Date(year_v, month_v, date_v + 7 - day_v, 23, 59, 59, 999).getTime();
  } else if (month) {
    start_ts = new Date(year_v, month_v, 1, 0, 0, 0, 0).getTime();
    end_ts = new Date(year_v, month_v + 1, 0, 23, 59, 59, 999).getTime();
  } else if (year) {
    start_ts = new Date(year_v, 0, 1, 0, 0, 0, 0).getTime();
    end_ts = new Date(year_v + 1, 0, 0, 23, 59, 59, 999).getTime();
  } else {
    console.log('No date range selected...');
    return;
  }

  const response = await fetch('/mypage/csreporting', {
    method: 'POST',
    cache: 'no-cache',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: {
        start_ts,
        end_ts,
      },
      ccode,
    }),
  });
  const json_report = await response.json();
  ProcessData(json_report);
}

function ProcessData(json_report) {
  // Sort countries
  let sort_data = [];
  for (let i = 0; i < json_report.country_distribution.namelist.length; i++) {
    sort_data.push({
      name: json_report.country_distribution.namelist[i],
      val: json_report.country_distribution.countlist[i],
    });
  }
  sort_data.sort((a, b) => {
    if (a.val > b.val) {
      return -1;
    } else if (a.val < b.val) {
      return 1;
    } else {
      return 0;
    }
  });
  for (let i = 0; i < json_report.country_distribution.namelist.length; i++) {
    json_report.country_distribution.namelist[i] = sort_data[i].name;
    json_report.country_distribution.countlist[i] = sort_data[i].val;
  }

  // Sort statuses
  sort_data = [];
  for (let i = 0; i < json_report.status_distribution.namelist.length; i++) {
    sort_data.push({
      name: json_report.status_distribution.namelist[i],
      val: json_report.status_distribution.countlist[i],
    });
  }
  sort_data.sort((a, b) => {
    if (a.val > b.val) {
      return -1;
    } else if (a.val < b.val) {
      return 1;
    } else {
      return 0;
    }
  });
  for (let i = 0; i < json_report.status_distribution.namelist.length; i++) {
    json_report.status_distribution.namelist[i] = sort_data[i].name;
    json_report.status_distribution.countlist[i] = sort_data[i].val;
  }

  // Save globally
  gdata = json_report;

  GenerateReport(json_report);

  document.getElementById('data_output').innerText = JSON.stringify(json_report, null, 2);
}

function PieChart(svg, margin, radius, delivered_status, total_records) {
  const graph = svg.append('g').attr('transform', `translate(${radius + margin.left},${radius + margin.top})`);

  // set the color scale
  const color = d3.scaleOrdinal().domain(delivered_status).range(['#75CC75', '#CCCC75', '#CC7575']);

  // Compute the position of each group on the pie:
  const pie = d3.pie().value(function (d) {
    return d.value;
  });
  const data_ready = pie(d3.entries(delivered_status));

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  graph
    .selectAll('whatever')
    .data(data_ready)
    .enter()
    .append('path')
    .attr('d', d3.arc().innerRadius(0).outerRadius(radius))
    .attr('fill', function (d) {
      return color(d.data.key);
    })
    .attr('stroke', 'black')
    .style('stroke-width', '2px')
    .style('opacity', 0.7)
    .on('click', function (d) {
      aquirerecords_progress(d.data.key);
    });

  // Legends
  let legends = svg.append('g').attr('transform', `translate(${2 * (radius + margin.left)},${radius + margin.top - 40})`);
  legends
    .selectAll('rect')
    .data(data_ready)
    .enter()
    .append('rect')
    .attr('x', 0)
    .attr('y', (d, index) => index * 30)
    .attr('width', 20)
    .attr('height', 20)
    .attr('fill', (d) => color(d.data.key))
    .attr('stroke', 'black')
    .style('stroke-width', '2px')
    .style('opacity', 0.7);
  const legend_labels = ['Delivered', 'In progress', 'On hold'];
  legends
    .selectAll('text')
    .data(data_ready)
    .enter()
    .append('text')
    .text(
      (d, index) =>
        `${legend_labels[index]} (${delivered_status[d.data.key]}: ${
          Math.round((1000 * delivered_status[d.data.key]) / total_records) / 10
        }%)`
    )
    .attr('x', 30)
    .attr('y', (d, index) => index * 30 + 15)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');
}

function HBarGraph(svg, margin, width, distribution) {
  const graph = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

  // X scaler
  const x = d3
    .scaleLinear()
    .domain([0, d3.max(distribution.countlist)])
    .range([0, width - 200]);

  // Name labels
  graph
    .selectAll('.textlabel')
    .data(distribution.namelist)
    .enter()
    .append('text')
    .attr('x', 10 - margin.left)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');

  // Graph background
  graph
    .append('rect')
    .attr('x', 150)
    .attr('y', 0)
    .attr('width', width - 150)
    .attr('height', distribution.countlist.length * 20)
    .attr('fill', '#222222');

  // Bars
  graph
    .selectAll('.bars')
    .data(distribution.countlist)
    .enter()
    .append('rect')
    .attr('x', 150)
    .attr('y', (d, i) => i * 20)
    .attr('width', (d) => x(d))
    .attr('height', 20)
    .attr('fill', 'steelblue')
    .attr('stroke', 'white')
    .style('stroke-width', '1px')
    .on('click', function (d, i) {
      aquirerecords_country_status(distribution.namelist[i]);
    })
    .append('title')
    .text((d, i) => distribution.namelist[i]);

  // Value labels
  graph
    .selectAll('.countlabel')
    .data(distribution.countlist)
    .enter()
    .append('text')
    .attr('x', (d) => x(d) + 160)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');
}

function ProgressGraph(svg, margin, width, height, data) {
  const graph = svg.append('g').attr('transform', `translate(${margin.left + margin.right},${0})`);

  // Pre-process data
  let start_date = data[0].shippeddate;
  let end_date = data[0].shippeddate;
  let displaydata = [];
  let datelookup = [];
  data.forEach((d) => {
    // Check edge cases
    if (d.shippeddate < start_date) {
      start_date = d.shippeddate;
    }
    if (d.shippeddate > end_date) {
      end_date = d.shippeddate;
    }

    // Generate date
    let date = new Date(d.shippeddate);
    let datestr = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    let index = datelookup.indexOf(datestr);
    if (index == -1) {
      index = datelookup.length;
      datelookup.push(datestr);
      displaydata.push({
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        all: 0,
        notdone: 0,
        onhold: 0,
      });
    }
    displaydata[index].all++;
    if (d.progress != 'delivered') {
      displaydata[index].notdone++;
      if (d.progress == 'delayedinjapan') {
        displaydata[index].onhold++;
      }
    }
  });
  // Sort
  displaydata.sort((a, b) => {
    if (a.date < b.date) {
      return -1;
    } else {
      return 1;
    }
  });

  // X scaler
  let X = d3
    .scaleTime()
    .domain([new Date(start_date), new Date(end_date)])
    .range([0, width]);

  // X axis
  graph
    .append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .call(d3.axisBottom(X).ticks(5).tickSizeOuter(0));

  // Y scaler
  let Y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

  // Graph
  graph
    .append('path')
    .datum(displaydata)
    .attr('fill', '#75CC75')
    .attr('fill-opacity', 0.7)
    .attr('stroke', 'none')
    .attr(
      'd',
      d3
        .area()
        .x(function (d) {
          return X(d.date);
        })
        .y0(function (d) {
          return Y(d.notdone / d.all);
        })
        .y1(function (d) {
          return Y(1);
        })
    );
  graph
    .append('path')
    .datum(displaydata)
    .attr('fill', '#CCCC75')
    .attr('fill-opacity', 0.7)
    .attr('stroke', 'none')
    .attr(
      'd',
      d3
        .area()
        .x(function (d) {
          return X(d.date);
        })
        .y0(function (d) {
          return Y(d.onhold / d.all);
        })
        .y1(function (d) {
          return Y(d.notdone / d.all);
        })
    );
  graph
    .append('path')
    .datum(displaydata)
    .attr('fill', '#CC7575')
    .attr('fill-opacity', 0.7)
    .attr('stroke', 'none')
    .attr(
      'd',
      d3
        .area()
        .x(function (d) {
          return X(d.date);
        })
        .y0(function (d) {
          return Y(0);
        })
        .y1(function (d) {
          return Y(d.onhold / d.all);
        })
    );
}

function GenerateReport(data) {
  document.getElementById('report_output').innerHTML = '';
  document.getElementById('search_button').style.display = 'none';

  const report_output = d3.select('#report_output');
  const rect = document.getElementById('report_output').getBoundingClientRect();

  // Draw area values
  const margin = {
    top: 10,
    right: 10,
    bottom: 10,
    left: 10,
  };
  const width = rect.width - margin.left - margin.right;
  const height = 300;
  const radius = height / 2;

  // Delivery pie chart
  report_output.append('h3').text(`Total records: ${data.total_records}`);
  let svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  PieChart(svg, margin, radius, data.delivered_status, data.total_records);

  // Progress report
  report_output.append('h3').text(`Progress report (based on shipping date)`);
  svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom);
  ProgressGraph(svg, margin, width, height, data.tracking_details);

  // Country
  report_output.append('h3').text(`Countries: ${data.country_distribution.namelist.length}`);
  svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 20 * data.country_distribution.namelist.length + margin.top + margin.bottom);
  HBarGraph(svg, margin, width, data.country_distribution);

  // Statuses
  report_output.append('h3').text(`Statuses: ${data.status_distribution.namelist.length}`);
  svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 20 * data.status_distribution.namelist.length + margin.top + margin.bottom);
  HBarGraph(svg, margin, width, data.status_distribution);
}

// Aquire records functions
function aquirerecords_progress(progress) {
  let odata = [];
  gdata.tracking_details.forEach((tr) => {
    if (tr.progress == progress) {
      odata.push(tr.tracking);
    }
  });

  // Output
  document.getElementById('tracking').value = odata.join('\n');
  document.getElementById('search_button').style.display = 'block';
}

function aquirerecords_country_status(value) {
  let odata = [];
  gdata.tracking_details.forEach((tr) => {
    if (tr.country == value || tr.status == value) {
      odata.push(tr.tracking);
    }
  });

  // Output
  document.getElementById('tracking').value = odata.join('\n');
  document.getElementById('search_button').style.display = 'block';
}
