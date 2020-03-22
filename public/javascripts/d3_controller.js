width = 500;
height = 250;
margin = { top: 20, right: 20, bottom: 30, left: 40 };
data = JSON.parse(document.getElementById('chart_data').innerHTML);

const range = d3.extent(data.all);
range[1]++;

const svg = d3.select('#chart').attr('viewBox', [0, 0, width, height]);

x = d3
  .scaleLinear()
  .domain(range)
  .nice()
  .range([margin.left, width - margin.right]);

dhl_bins = d3
  .histogram()
  .domain(x.domain())
  .thresholds(x.ticks(10))(data.dhl);

ems_bins = d3
  .histogram()
  .domain(x.domain())
  .thresholds(x.ticks(10))(data.dhl_ems);

sal_bins = d3
  .histogram()
  .domain(x.domain())
  .thresholds(x.ticks(10))(data.all);

y = d3
  .scaleLinear()
  .domain([0, d3.max(sal_bins, d => d.length)])
  .nice()
  .range([height - margin.bottom, margin.top]);

xAxis = g =>
  g
    .attr('transform', `translate(0,${height - margin.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(width / 80)
        .tickSizeOuter(0)
    )
    .call(g =>
      g
        .append('text')
        .attr('x', width - margin.right)
        .attr('y', -4)
        .attr('fill', 'currentColor')
        .attr('font-weight', 'bold')
        .attr('text-anchor', 'end')
        .text(data.x)
    );
yAxis = g =>
  g
    .attr('transform', `translate(${margin.left},0)`)
    .call(d3.axisLeft(y).ticks(height / 40))
    .call(g => g.select('.domain').remove())
    .call(g =>
      g
        .select('.tick:last-of-type text')
        .clone()
        .attr('x', 4)
        .attr('text-anchor', 'start')
        .attr('font-weight', 'bold')
        .text(data.y)
    );

svg
  .append('g')
  .attr('fill', 'steelblue')
  .selectAll('rect')
  .data(sal_bins)
  .join('rect')
  .attr('x', d => x(d.x0) + 1)
  .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
  .attr('y', d => y(d.length))
  .attr('height', d => y(0) - y(d.length));

svg
  .append('g')
  .attr('fill', 'green')
  .selectAll('rect')
  .data(ems_bins)
  .join('rect')
  .attr('x', d => x(d.x0) + 1)
  .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
  .attr('y', d => y(d.length))
  .attr('height', d => y(0) - y(d.length));

svg
  .append('g')
  .attr('fill', 'orange')
  .selectAll('rect')
  .data(dhl_bins)
  .join('rect')
  .attr('x', d => x(d.x0) + 1)
  .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
  .attr('y', d => y(d.length))
  .attr('height', d => y(0) - y(d.length));

svg.append('g').call(xAxis);

svg.append('g').call(yAxis);
