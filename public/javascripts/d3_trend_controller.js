const width = 500;
const height = 250;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };
const data = JSON.parse(document.getElementById('chart_data').innerHTML);

data.delivery_times.sort((a, b) => {
  if (a.date > b.date) {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  } else {
    return 0;
  }
});

// DHL
let svg = d3
  .select('#chart_dhl')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
var x = d3
  .scaleTime()
  .domain(
    d3.extent(data.delivery_times, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

var y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data.delivery_times, function(d) {
      return d.DHL_count > 0 ? d.DHL_total_days / d.DHL_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(data.delivery_times)
  .attr('fill', 'none')
  .attr('stroke', 'orange')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .line()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y(function(d) {
        return y(d.DHL_count > 0 ? d.DHL_total_days / d.DHL_count : 0);
      })
  );

// EMS
svg = d3
  .select('#chart_ems')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
var x = d3
  .scaleTime()
  .domain(
    d3.extent(data.delivery_times, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

var y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data.delivery_times, function(d) {
      return d.EMS_count > 0 ? d.EMS_total_days / d.EMS_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(data.delivery_times)
  .attr('fill', 'none')
  .attr('stroke', 'green')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .line()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y(function(d) {
        return y(d.EMS_count > 0 ? d.EMS_total_days / d.EMS_count : 0);
      })
  );

// Other
svg = d3
  .select('#chart_other')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
var x = d3
  .scaleTime()
  .domain(
    d3.extent(data.delivery_times, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

var y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data.delivery_times, function(d) {
      return d.OTHER_count > 0 ? d.OTHER_total_days / d.OTHER_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(data.delivery_times)
  .attr('fill', 'none')
  .attr('stroke', 'steelblue')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .line()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y(function(d) {
        return y(d.OTHER_count > 0 ? d.OTHER_total_days / d.OTHER_count : 0);
      })
  );
