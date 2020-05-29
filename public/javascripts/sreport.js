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

  GenerateReport(json_report);

  document.getElementById('data_output').innerText = JSON.stringify(json_report, null, 2);
}

function GenerateReport(data) {
  const report_output = d3.select('#report_output');
  const rect = document.getElementById('report_output').getBoundingClientRect();

  // Draw area values
  const margin = {
    top: 10,
    right: 10,
    bottom: 50,
    left: 50,
  };
  const width = rect.width - margin.left - margin.right;
  const height = 300;
  const radius = Math.min(width, height) / 2 - 60;

  // Title
  report_output.append('h3').text(`Total records: ${data.total_records}`);

  // Delivery pie chart
  let svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', height + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${radius + margin.left},${(height + margin.top + margin.bottom) / 2})`);

  // set the color scale
  const color = d3.scaleOrdinal().domain(data.delivered_status).range(['#75CC75', '#CCCC75', '#CC7575']);

  // Compute the position of each group on the pie:
  const pie = d3.pie().value(function (d) {
    return d.value;
  });
  const data_ready = pie(d3.entries(data.delivered_status));

  // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
  svg
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
    .style('opacity', 0.7);

  // Legends
  let legends = report_output
    .select('svg')
    .append('g')
    .attr('transform', `translate(${2 * (radius + margin.left)},${(height + margin.top + margin.bottom) / 2 - 40})`);
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
        `${legend_labels[index]} (${data.delivered_status[d.data.key]}: ${
          Math.round((1000 * data.delivered_status[d.data.key]) / data.total_records) / 10
        }%)`
    )
    .attr('x', 30)
    .attr('y', (d, index) => index * 30 + 15)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');

  // Country
  report_output.append('h3').text(`Countries: ${data.country_distribution.namelist.length}`);
  svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 20 * data.country_distribution.namelist.length + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // X scaler
  let x = d3
    .scaleLinear()
    .domain([0, d3.max(data.country_distribution.countlist)])
    .range([0, width - 150]);

  // Bars
  svg
    .selectAll('rect')
    .data(data.country_distribution.countlist)
    .enter()
    .append('rect')
    .attr('x', 100)
    .attr('y', (d, i) => i * 20)
    .attr('width', (d) => x(d))
    .attr('height', 20)
    .attr('fill', 'steelblue')
    .attr('stroke', 'white')
    .style('stroke-width', '1px');

  // Labels
  svg
    .selectAll('text')
    .data(data.country_distribution.namelist)
    .enter()
    .append('text')
    .attr('x', 10 - margin.left)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');
  // Labels2
  svg
    .selectAll('.nlabel')
    .data(data.country_distribution.countlist)
    .enter()
    .append('text')
    .attr('x', (d) => x(d) + 110)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');

  // Statuses
  report_output.append('h3').text(`Statuses: ${data.status_distribution.namelist.length}`);
  svg = report_output
    .append('svg')
    .attr('width', width + margin.left + margin.right)
    .attr('height', 20 * data.status_distribution.namelist.length + margin.top + margin.bottom)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  // X scaler
  x = d3
    .scaleLinear()
    .domain([0, d3.max(data.status_distribution.countlist)])
    .range([0, width - 150]);

  // Bars
  svg
    .selectAll('rect')
    .data(data.status_distribution.countlist)
    .enter()
    .append('rect')
    .attr('x', 100)
    .attr('y', (d, i) => i * 20)
    .attr('width', (d) => x(d))
    .attr('height', 20)
    .attr('fill', 'steelblue')
    .attr('stroke', 'white')
    .style('stroke-width', '1px')
    .append('title')
    .text((d, i) => data.status_distribution.namelist[i]);

  // Labels
  svg
    .selectAll('text')
    .data(data.status_distribution.namelist)
    .enter()
    .append('text')
    .attr('x', 10 - margin.left)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d.slice(0, 9))
    .attr('stroke', 'white')
    .style('stroke-width', '1px');
  // Labels2
  svg
    .selectAll('.nlabel')
    .data(data.status_distribution.countlist)
    .enter()
    .append('text')
    .attr('x', (d) => x(d) + 110)
    .attr('y', (d, i) => i * 20 + 15)
    .text((d) => d)
    .attr('stroke', 'white')
    .style('stroke-width', '1px');
}
