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
const dhl_data = data.delivery_times.filter(d => d.DHL_count > 0);
const ems_data = data.delivery_times.filter(d => d.EMS_count > 0);
const other_data = data.delivery_times.filter(d => d.OTHER_count > 0);
data.undelivered_packages.sort((a, b) => {
  if (a.date > b.date) {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  } else {
    return 0;
  }
});
const dhl_data_num = data.undelivered_packages.filter(d => d.DHL_count > 0);
const ems_data_num = data.undelivered_packages.filter(d => d.EMS_count > 0);
const other_data_num = data.undelivered_packages.filter(d => d.OTHER_count > 0);

// DHL
let svg = d3
  .select('#chart_dhl')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
let x = d3
  .scaleTime()
  .domain(
    d3.extent(dhl_data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

let y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(dhl_data, function(d) {
      return d.DHL_count > 0 ? d.DHL_total_days / d.DHL_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(dhl_data)
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
x = d3
  .scaleTime()
  .domain(
    d3.extent(ems_data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(ems_data, function(d) {
      return d.EMS_count > 0 ? d.EMS_total_days / d.EMS_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(ems_data)
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
x = d3
  .scaleTime()
  .domain(
    d3.extent(other_data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(other_data, function(d) {
      return d.OTHER_count > 0 ? d.OTHER_total_days / d.OTHER_count : 0;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(other_data)
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

// DHL number of packages
svg = d3
  .select('#chart_dhl_num')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(dhl_data_num, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(dhl_data_num, function(d) {
      return d.DHL_count;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(dhl_data_num)
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
        return y(d.DHL_count);
      })
  );

// EMS number of packages
svg = d3
  .select('#chart_ems_num')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(ems_data_num, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(ems_data_num, function(d) {
      return d.EMS_count;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(ems_data_num)
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
        return y(d.EMS_count);
      })
  );

// OTHER number of packages
svg = d3
  .select('#chart_other_num')
  .attr('width', width + margin.left + margin.right)
  .attr('height', height + margin.top + margin.bottom)
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(other_data_num, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(other_data_num, function(d) {
      return d.OTHER_count;
    })
  ])
  .range([height, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(other_data_num)
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
        return y(d.OTHER_count);
      })
  );
