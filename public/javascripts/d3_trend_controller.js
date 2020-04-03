const width = 800;
const height = 500;
const margin = { top: 20, right: 20, bottom: 30, left: 40 };

const data = JSON.parse(document.getElementById('chart_data').innerHTML);
data.sort((a, b) => {
  if (a.date > b.date) {
    return 1;
  } else if (a.date < b.date) {
    return -1;
  } else {
    return 0;
  }
});
const dhl_avg = data.filter(d => d.DHL_count_done > 0);
const ems_avg = data.filter(d => d.EMS_count_done > 0);
const other_avg = data.filter(d => d.OTHER_count_done > 0);

// DHL number of packages
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
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

let y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data, function(d) {
      return d.DHL_count_all;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));
// Total
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffbbaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.DHL_count_all);
      })
  );
// Total, excluding newly shipped
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffaaaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 0.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.DHL_count_all - d.DHL_count_new);
      })
  );
// Delivered
svg
  .append('path')
  .datum(data)
  .attr('fill', '#aaffaa')
  .attr('stroke', 'green')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.DHL_count_done);
      })
  );
// DHL average time
svg = d3
  .select('#chart_dhl')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + (margin.top + height / 2) + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(dhl_avg, function(d) {
      return d.DHL_total_days / d.DHL_count_done;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(dhl_avg)
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
        return y(d.DHL_total_days / d.DHL_count_done);
      })
  );
// Cutoff line
svg
  .append('line')
  .attr('x1', x(d3.timeParse('%Y-%m-%d')(data[data.length - 3].date)))
  .attr('y1', y(0))
  .attr('x2', x(d3.timeParse('%Y-%m-%d')(data[data.length - 3].date)))
  .attr('y2', y(1000))
  .attr('stroke', '#aabb55')
  .attr('stroke-width', 2)
  .attr('stroke-dasharray', '5 5')
  .attr('class', 'zeroline');

// EMS number of packages
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
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data, function(d) {
      return d.EMS_count_all;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));
// Total
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffbbaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.EMS_count_all);
      })
  );
// Total, excluding newly shipped
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffaaaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 0.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.EMS_count_all - d.EMS_count_new);
      })
  );
// Delivered
svg
  .append('path')
  .datum(data)
  .attr('fill', '#aaffaa')
  .attr('stroke', 'green')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.EMS_count_done);
      })
  );
// EMS average time
svg = d3
  .select('#chart_ems')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + (margin.top + height / 2) + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(ems_avg, function(d) {
      return d.EMS_total_days / d.EMS_count_done;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(ems_avg)
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
        return y(d.EMS_total_days / d.EMS_count_done);
      })
  );
// Cutoff line
svg
  .append('line')
  .attr('x1', x(d3.timeParse('%Y-%m-%d')(data[data.length - 7].date)))
  .attr('y1', y(0))
  .attr('x2', x(d3.timeParse('%Y-%m-%d')(data[data.length - 7].date)))
  .attr('y2', y(1000))
  .attr('stroke', '#aabb55')
  .attr('stroke-width', 2)
  .attr('stroke-dasharray', '5 5')
  .attr('class', 'zeroline');

// OTHER number of packages
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
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(data, function(d) {
      return d.OTHER_count_all;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));
// Total
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffbbaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.OTHER_count_all);
      })
  );
// Total, excluding newly shipped
svg
  .append('path')
  .datum(data)
  .attr('fill', '#ffaaaa')
  .attr('stroke', 'red')
  .attr('stroke-width', 0.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.OTHER_count_all - d.OTHER_count_new);
      })
  );
// Delivered
svg
  .append('path')
  .datum(data)
  .attr('fill', '#aaffaa')
  .attr('stroke', 'green')
  .attr('stroke-width', 1.5)
  .attr(
    'd',
    d3
      .area()
      .x(function(d) {
        return x(d3.timeParse('%Y-%m-%d')(d.date));
      })
      .y0(y(0))
      .y1(function(d) {
        return y(d.OTHER_count_done);
      })
  );
// OTHER average time
svg = d3
  .select('#chart_other')
  .append('g')
  .attr('transform', 'translate(' + margin.left + ',' + (margin.top + height / 2) + ')');

// Draw a line graph
x = d3
  .scaleTime()
  .domain(
    d3.extent(data, function(d) {
      return d3.timeParse('%Y-%m-%d')(d.date);
    })
  )
  .range([0, width]);
svg
  .append('g')
  .attr('transform', 'translate(0,' + height / 2 + ')')
  .call(d3.axisBottom(x));

y = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(other_avg, function(d) {
      return d.OTHER_total_days / d.OTHER_count_done;
    })
  ])
  .range([height / 2, 0]);
svg.append('g').call(d3.axisLeft(y));

svg
  .append('path')
  .datum(other_avg)
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
        return y(d.OTHER_total_days / d.OTHER_count_done);
      })
  );
// Cutoff line
svg
  .append('line')
  .attr('x1', x(d3.timeParse('%Y-%m-%d')(data[data.length - 7].date)))
  .attr('y1', y(0))
  .attr('x2', x(d3.timeParse('%Y-%m-%d')(data[data.length - 7].date)))
  .attr('y2', y(1000))
  .attr('stroke', '#aabb55')
  .attr('stroke-width', 2)
  .attr('stroke-dasharray', '5 5')
  .attr('class', 'zeroline');
