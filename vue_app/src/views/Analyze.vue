<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1>Free search</h1>
        <p>*Tracking number search</p>
        <form @submit="analyze">
          <label for="records1">Records to analyze</label>
          <textarea name="records1" id="records1" class="form-control" cols="30" rows="10" v-model="records" required></textarea>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
      <div class="col">
        <h1>Label search</h1>
        <p>*Label search</p>
        <form @submit="analyzelabel">
          <label for="records2">Label to analyze</label>
          <select name="records2" id="records2" class="form-control" v-model="label" required>
            <option :key="a.id" :value="a.id" v-for="a in grouplabels">
              {{ a.label }}
            </option>
          </select>
          <label for="delivereddate">Delivered date range</label>
          <select name="delivereddate" id="delivereddate" class="form-control">
            <option value="all">All</option>
            <option value="2020">2020</option>
            <option value="2020-11">November 2020</option>
            <option value="2020-12">December 2020</option>
            <option value="2021">2021</option>
            <option value="2021-1">January 2021</option>
            <option value="2021-2">February 2021</option>
            <option value="2021-3">March 2021</option>
          </select>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
        <button class="btn btn-primary mt-3" v-on:click="AnalyzeAllLabels()">Analyze all "AITコンテナ"</button>
      </div>
    </div>
    <div class="row" v-if="display">
      <div class="col">
        <h1>Result</h1>
        <div id="accordion">
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingOne">
              <h5 class="mb-0">
                <button
                  class="btn btn-link"
                  data-toggle="collapse"
                  data-target="#collapseOne"
                  aria-expanded="true"
                  aria-controls="collapseOne"
                >
                  Summary
                </button>
              </h5>
            </div>

            <div id="collapseOne" class="collapse show" aria-labelledby="headingOne" data-parent="#accordion">
              <div class="card-body">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Delivered</th>
                      <th>Shipped</th>
                      <th>Returned</th>
                      <th>Lost</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td class="delivered">
                        {{ display.summary.delivered }} ({{
                          Math.round((10000 * display.summary.delivered) / display.summary.total_records) / 100
                        }}%)
                        <button class="btn btn-primary" v-on:click="Copy('delivered_list')">Copy</button>
                      </td>
                      <td class="delayed">
                        {{ display.summary.shipped }} ({{
                          Math.round((10000 * display.summary.shipped) / display.summary.total_records) / 100
                        }}%)
                        <button class="btn btn-primary" v-on:click="Copy('shipped_list')">Copy</button>
                      </td>
                      <td class="returned">
                        {{ display.summary.returned }} ({{
                          Math.round((10000 * display.summary.returned) / display.summary.total_records) / 100
                        }}%)
                        <button class="btn btn-primary" v-on:click="Copy('returned_list')">Copy</button>
                      </td>
                      <td class="lost">
                        {{ display.summary.lost }} ({{ Math.round((10000 * display.summary.lost) / display.summary.total_records) / 100 }}%)
                        <button class="btn btn-primary" v-on:click="Copy('lost_list')">Copy</button>
                      </td>
                      <td>{{ display.summary.total_records }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingTwo">
              <h5 class="mb-0">
                <button
                  class="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseTwo"
                  aria-expanded="false"
                  aria-controls="collapseTwo"
                >
                  Times
                </button>
              </h5>
            </div>
            <div id="collapseTwo" class="collapse" aria-labelledby="headingTwo" data-parent="#accordion">
              <div class="card-body">
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Delivered<br />Avg. days</th>
                      <th>Overall<br />Avg. days</th>
                      <th>In shipment<br />Avg. days</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>
                        {{
                          Math.round(
                            display.times.delivered.totaltime_ms /
                            display.times.delivered.number /
                            100 /*ms +10 after rounding */ /
                            60 /*sec*/ /
                            60 /*min*/ /
                              24 /*hr*/
                          ) / 10
                        }}
                      </td>
                      <td>
                        {{
                          Math.round(
                            (display.times.delivered.totaltime_ms + display.times.inshipment.totaltime_ms) /
                            (display.times.delivered.number + display.times.inshipment.number) /
                            100 /*ms +10 after rounding */ /
                            60 /*sec*/ /
                            60 /*min*/ /
                              24 /*hr*/
                          ) / 10
                        }}
                      </td>
                      <td>
                        {{
                          Math.round(
                            display.times.inshipment.totaltime_ms /
                            display.times.inshipment.number /
                            100 /*ms +10 after rounding */ /
                            60 /*sec*/ /
                            60 /*min*/ /
                              24 /*hr*/
                          ) / 10
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div id="graph_area"></div>
                <b>*Note: Data will only be accurate after most packages has been delivered.</b>
              </div>
            </div>
          </div>
          <div class="card text-white bg-dark">
            <div class="card-header" id="headingThree">
              <h5 class="mb-0">
                <button
                  class="btn btn-link collapsed"
                  data-toggle="collapse"
                  data-target="#collapseThree"
                  aria-expanded="false"
                  aria-controls="collapseThree"
                >
                  Status
                </button>
              </h5>
            </div>
            <div id="collapseThree" class="collapse" aria-labelledby="headingThree" data-parent="#accordion">
              <div class="card-body">
                <h2>Delivered statuses</h2>
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Left at place</th>
                      <th>Post box</th>
                      <th>In person</th>
                      <th>Unknown</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{ display.status.delivered.door }}</td>
                      <td>{{ display.status.delivered.post_locker }}</td>
                      <td>{{ display.status.delivered.reception_person }}</td>
                      <td>{{ display.status.delivered.unknown }}</td>
                    </tr>
                  </tbody>
                </table>
                <h2>In shipment statuses</h2>
                <table class="table table-dark table-striped">
                  <thead>
                    <tr>
                      <th>Prepare shipment</th>
                      <th>In transit</th>
                      <th>At post office</th>
                      <th>Other</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>{{ display.status.inshipment.prepare_shipping }}</td>
                      <td>{{ display.status.inshipment.in_tansit }}</td>
                      <td>
                        {{ display.status.inshipment.delivery_attempt_await_pickup }}
                      </td>
                      <td>{{ display.status.inshipment.other }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as d3 from 'd3';

export default {
  name: 'Analyze',
  data() {
    return {
      records: '',
      label: '',
      display: undefined,
    };
  },
  computed: mapGetters(['allTrackingData', 'grouplabels']),
  methods: {
    Copy: function(type) {
      let text_str = '';
      this.display.summary[type].forEach((track) => (text_str += `${track}\n`));
      const copyelement = document.createElement('textarea');
      copyelement.value = text_str;
      document.body.appendChild(copyelement);
      copyelement.focus();
      copyelement.select();
      document.execCommand('copy');
      copyelement.parentElement.removeChild(copyelement);
    },
    drawgraph: function() {
      // Clear previous graph
      if (document.getElementById('graph_area')) {
        document.getElementById('graph_area').innerHTML = '';
      }

      /*
      Data source X: this.display.times.delivered.histogram.date_ts // timestamp in ms
      Data source Y: this.display.times.delivered.histogram.count   // integer count
      */
      // SVG stuff
      // set the dimensions and margins of the graph
      var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      // set the ranges
      var x = d3
        .scaleTime()
        .domain([
          new Date(d3.min(this.display.times.delivered.histogram.date_ts)),
          new Date(d3.max(this.display.times.delivered.histogram.date_ts)),
        ])
        .range([0, width]);
      var y = d3
        .scaleLinear()
        .domain([0, d3.max(this.display.times.delivered.histogram.count)])
        .range([height, 0]);

      // append the svg object to the body of the page
      // append a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      var svg = d3
        .select('#graph_area')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // append the rectangles for the bar chart
      svg
        .selectAll('.histbar')
        .data(this.display.times.delivered.histogram.date_ts)
        .enter()
        .append('rect')
        .attr('class', 'histbar')
        .attr('fill', 'steelblue')
        .attr('x', (d) => x(d))
        .attr('width', 10)
        .attr('y', (d, i) => y(this.display.times.delivered.histogram.count[i]))
        .attr('height', (d, i) => height - y(this.display.times.delivered.histogram.count[i]));

      // add the x Axis
      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

      // add the y Axis
      svg.append('g').call(d3.axisLeft(y));

      // Delivery time graph
      /*
      deliverytimehistogram: [],               // 90 element array, within 0-89 days
      deliverytimehistogram_totaldelivered: 0, // All delivered
      deliverytimehistogram_totalcount: 0,     // All records(including undelivered)

      Data source X: this.display.times.deliverytimehistogram [index] // timestamp in ms
      Data source Y1: this.display.times.deliverytimehistogram/this.display.times.deliverytimehistogram_totaldelivered   // integer count
      Data source Y2: this.display.times.deliverytimehistogram/this.display.times.deliverytimehistogram_totalcount   // integer count
      */
      // set the ranges
      x = d3
        .scaleLinear()
        .domain([0, 89])
        .range([0, width]);
      y = d3
        .scaleLinear()
        .domain([0, 1])
        .range([height, 0]);

      // append the svg object to the body of the page
      // append a 'group' element to 'svg'
      // moves the 'group' element to the top left margin
      let div_explainer = document.createElement('DIV');
      document.getElementById('graph_area').append(div_explainer);

      svg = d3
        .select('#graph_area')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

      // append the rectangles for the bar chart
      let first_over_99 = false;
      svg
        .selectAll('.histbar')
        .data(this.display.times.deliverytimehistogram)
        .enter()
        .append('rect')
        .attr('class', 'histbar')
        .attr('fill', (d, i) => {
          if (d / this.display.times.deliverytimehistogram_totaldelivered > 0.99 && first_over_99 == false) {
            first_over_99 = true;
            div_explainer.innerText = `A 99% delivery rate of packages known to be delivered, were reached ${i} days from shipment.`;
            return 'green';
          } else {
            return 'steelblue';
          }
        })
        .attr('x', (d, i) => x(i))
        .attr('width', 9)
        .attr('y', (d) => y(d / this.display.times.deliverytimehistogram_totaldelivered))
        .attr('height', (d) => height - y(d / this.display.times.deliverytimehistogram_totaldelivered));

      // append the rectangles for the bar chart
      // svg
      //   .selectAll(".histbar2")
      //   .data(this.display.times.deliverytimehistogram)
      //   .enter()
      //   .append("rect")
      //   .attr("class", "histbar2")
      //   .attr("fill", "orange")
      //   .attr("x", (d, i) => x(i))
      //   .attr("width", 9)
      //   .attr("y", (d) => y(d / this.display.times.deliverytimehistogram_totalcount))
      //   .attr(
      //     "height",
      //     (d) => height - y(d / this.display.times.deliverytimehistogram_totalcount)
      //   );
      const divider = this.display.times.deliverytimehistogram_totalcount;
      svg
        .append('path')
        .datum(this.display.times.deliverytimehistogram)
        .attr('fill', 'none')
        .attr('stroke', 'orange')
        .attr('stroke-width', 3)
        .attr(
          'd',
          d3
            .line()
            .x(function(d, i) {
              return x(i);
            })
            .y(function(d) {
              return y(d / divider);
            })
        );

      // add the x Axis
      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

      // add the y Axis
      svg.append('g').call(d3.axisLeft(y));
    },
    analyze(e) {
      e.preventDefault();

      // Format data to send (from "records")
      const input_data = this.records.split(/[\r\n]+/); // Split on new line characters

      // Acquire records
      const analyze_data = this.allTrackingData.filter((d) => input_data.indexOf(d.tracking) >= 0);

      const summary = {
        delivered: 0,
        delivered_list: [],
        shipped: 0,
        shipped_list: [],
        returned: 0,
        returned_list: [],
        lost: 0,
        lost_list: [],
        total_records: analyze_data.length,
      };
      const times = {
        delivered: {
          number: 0,
          totaltime_ms: 0,
          histogram: {
            date_ts: [],
            count: [],
          },
        },
        inshipment: {
          number: 0,
          totaltime_ms: 0,
        },
        deliverytimehistogram: [], // 90 element array, within 0-89 days
        deliverytimehistogram_totaldelivered: 0, // All delivered
        deliverytimehistogram_totalcount: 0, // All records(including undelivered)
      };
      const status = {
        delivered: {
          door: 0,
          post_locker: 0,
          reception_person: 0,
          unknown: 0,
        },
        inshipment: {
          prepare_shipping: 0,
          in_tansit: 0,
          delivery_attempt_await_pickup: 0,
          other: 0,
        },
      };

      for (let fa = 0; fa < 90; fa++) {
        times.deliverytimehistogram.push(0);
      }

      analyze_data.forEach((d) => {
        times.deliverytimehistogram_totalcount++;
        if (d.delivered) {
          if (d.delivereddate == 0) {
            if (d.status == 'returned') {
              summary.returned++;
              summary.returned_list.push(d.tracking);
            } else {
              summary.lost++;
              summary.lost_list.push(d.tracking);
            }
          } else {
            summary.delivered++;
            summary.delivered_list.push(d.tracking);
            if (d.delivereddate > 1) {
              times.delivered.number++;
              times.delivered.totaltime_ms += d.delivereddate - d.shippeddate;

              const dth = Math.ceil((d.delivereddate - d.shippeddate) / (1000 * 60 * 60 * 24));
              times.deliverytimehistogram_totaldelivered++;
              for (let hi = 0; hi < 90; hi++) {
                if (hi >= dth) {
                  times.deliverytimehistogram[hi]++;
                }
              }

              const date = new Date(d.delivereddate);
              const d_ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
              const index = times.delivered.histogram.date_ts.indexOf(d_ts);
              if (index == -1) {
                times.delivered.histogram.date_ts.push(d_ts);
                times.delivered.histogram.count.push(1);
              } else {
                times.delivered.histogram.count[index]++;
              }
            }

            // Status check
            if (d.status.indexOf('door') >= 0 || d.status.indexOf('garage') >= 0) {
              status.delivered.door++;
            } else if (d.status.indexOf('locker') >= 0 || d.status.indexOf('mailbox') >= 0 || d.status.indexOf('PO Box') >= 0) {
              status.delivered.post_locker++;
            } else if (
              d.status.indexOf('reception') >= 0 ||
              d.status.indexOf('neighbor') >= 0 ||
              d.status.indexOf('picked up at') >= 0 ||
              d.status.indexOf('individual') >= 0
            ) {
              status.delivered.reception_person++;
            } else {
              status.delivered.unknown++;
            }
          }
        } else {
          summary.shipped++;
          summary.shipped_list.push(d.tracking);

          times.inshipment.number++;
          times.inshipment.totaltime_ms += Date.now() - d.shippeddate;

          // Status check
          if (d.status.indexOf('label has been prepared') >= 0 || d.status.indexOf('shipping partner facility') >= 0) {
            status.inshipment.prepare_shipping++;
          } else if (
            d.status.indexOf('has not been updated') >= 0 ||
            d.status.indexOf('on its way to the destination') >= 0 ||
            d.status.indexOf('in transit to the destination') >= 0 ||
            d.status.indexOf('in transit to the next facility') >= 0 ||
            d.status.indexOf('arrived at the hub') >= 0 ||
            d.status.indexOf('forwarded to a different') >= 0 ||
            d.status.indexOf('arrived at the Post Office') >= 0 ||
            d.status == 'Shipped'
          ) {
            status.inshipment.in_tansit++;
          } else if (
            d.status.indexOf('attempted to deliver') >= 0 ||
            d.status.indexOf('delivery attempt') >= 0 ||
            d.status.indexOf('is being held at') >= 0 ||
            d.status.indexOf('ready for pickup') >= 0
          ) {
            status.inshipment.delivery_attempt_await_pickup++;
          } else {
            status.inshipment.other++;
          }
        }
      });

      // Process analysis
      this.display = { summary, times, status };

      // Display graphs
      setTimeout(this.drawgraph, 1000);
    },
    analyzelabel(e) {
      e.preventDefault();

      // Generate date range (shipping date)
      const option = document.getElementById('delivereddate').value.split('-');
      let start_ts = 0;
      let end_ts = Date.now();
      if (option != 'all') {
        if (option.length == 1) {
          // Year
          start_ts = (new Date(parseInt(option[0]), 0, 1, 0, 0, 0, 0)).getTime();
          end_ts = (new Date(parseInt(option[0]), 11, 31, 23, 59, 59, 999)).getTime();
        } else {
          // Year-Month
          start_ts = (new Date(parseInt(option[0]), parseInt(option[1])-1, 1, 0, 0, 0, 0)).getTime();
          end_ts = (new Date(parseInt(option[0]), parseInt(option[1]), 0, 23, 59, 59, 999)).getTime();
        }
      }

      // Format data to send (from "label")
      const input_data = parseInt(this.label);

      // Acquire records
      const analyze_data = this.allTrackingData.filter((d) => d.grouplabel === input_data && d.delivereddate >= start_ts && d.delivereddate <= end_ts);

      const summary = {
        delivered: 0,
        delivered_list: [],
        shipped: 0,
        shipped_list: [],
        returned: 0,
        returned_list: [],
        lost: 0,
        lost_list: [],
        total_records: analyze_data.length,
      };
      const times = {
        delivered: {
          number: 0,
          totaltime_ms: 0,
          histogram: {
            date_ts: [],
            count: [],
          },
        },
        inshipment: {
          number: 0,
          totaltime_ms: 0,
        },
        deliverytimehistogram: [], // 90 element array, within 0-89 days
        deliverytimehistogram_totaldelivered: 0, // All delivered
        deliverytimehistogram_totalcount: 0, // All records(including undelivered)
      };
      const status = {
        delivered: {
          door: 0,
          post_locker: 0,
          reception_person: 0,
          unknown: 0,
        },
        inshipment: {
          prepare_shipping: 0,
          in_tansit: 0,
          delivery_attempt_await_pickup: 0,
          other: 0,
        },
      };

      for (let fa = 0; fa < 90; fa++) {
        times.deliverytimehistogram.push(0);
      }

      analyze_data.forEach((d) => {
        times.deliverytimehistogram_totalcount++;
        if (d.delivered) {
          if (d.delivereddate == 0) {
            if (d.status == 'returned') {
              summary.returned++;
              summary.returned_list.push(d.tracking);
            } else {
              summary.lost++;
              summary.lost_list.push(d.tracking);
            }
          } else {
            summary.delivered++;
            summary.delivered_list.push(d.tracking);
            if (d.delivereddate > 1) {
              times.delivered.number++;
              times.delivered.totaltime_ms += d.delivereddate - d.shippeddate;

              const dth = Math.ceil((d.delivereddate - d.shippeddate) / (1000 * 60 * 60 * 24));
              times.deliverytimehistogram_totaldelivered++;
              for (let hi = 0; hi < 90; hi++) {
                if (hi >= dth) {
                  times.deliverytimehistogram[hi]++;
                }
              }

              const date = new Date(d.delivereddate);
              const d_ts = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
              const index = times.delivered.histogram.date_ts.indexOf(d_ts);
              if (index == -1) {
                times.delivered.histogram.date_ts.push(d_ts);
                times.delivered.histogram.count.push(1);
              } else {
                times.delivered.histogram.count[index]++;
              }
            }

            // Status check
            if (d.status.indexOf('door') >= 0 || d.status.indexOf('garage') >= 0) {
              status.delivered.door++;
            } else if (d.status.indexOf('locker') >= 0 || d.status.indexOf('mailbox') >= 0 || d.status.indexOf('PO Box') >= 0) {
              status.delivered.post_locker++;
            } else if (
              d.status.indexOf('reception') >= 0 ||
              d.status.indexOf('neighbor') >= 0 ||
              d.status.indexOf('picked up at') >= 0 ||
              d.status.indexOf('individual') >= 0
            ) {
              status.delivered.reception_person++;
            } else {
              status.delivered.unknown++;
            }
          }
        } else {
          summary.shipped++;
          summary.shipped_list.push(d.tracking);

          times.inshipment.number++;
          times.inshipment.totaltime_ms += Date.now() - d.shippeddate;

          // Status check
          if (d.status.indexOf('label has been prepared') >= 0 || d.status.indexOf('shipping partner facility') >= 0) {
            status.inshipment.prepare_shipping++;
          } else if (
            d.status.indexOf('has not been updated') >= 0 ||
            d.status.indexOf('on its way to the destination') >= 0 ||
            d.status.indexOf('in transit to the destination') >= 0 ||
            d.status.indexOf('in transit to the next facility') >= 0 ||
            d.status.indexOf('arrived at the hub') >= 0 ||
            d.status.indexOf('forwarded to a different') >= 0 ||
            d.status.indexOf('arrived at the Post Office') >= 0 ||
            d.status == 'Shipped'
          ) {
            status.inshipment.in_tansit++;
          } else if (
            d.status.indexOf('attempted to deliver') >= 0 ||
            d.status.indexOf('delivery attempt') >= 0 ||
            d.status.indexOf('is being held at') >= 0 ||
            d.status.indexOf('ready for pickup') >= 0
          ) {
            status.inshipment.delivery_attempt_await_pickup++;
          } else {
            status.inshipment.other++;
          }
        }
      });

      // Process analysis
      this.display = { summary, times, status };

      // Display graphs
      setTimeout(this.drawgraph, 1000);
    },
    AnalyzeAllLabels: function() {
      // Analyze stuff
      const result = [];
      const indexer = [];
      this.grouplabels.forEach((label) => {
        if (label.label.indexOf("AITコンテナ") == 0) {
          result.push({
            label: label.label,
            lableid: label.id,
            firstdelivereddate: 4765100399000,
            numberdelivered: 0,
            numberinshipment: 0,
            numberreturned: 0,
            numberlost: 0,
            total: 0,
            deliveredonground: 0,
            deliveredinbox: 0,
            deliveredtoperson: 0,
            deliveredunknown: 0,
          });
          indexer.push(label.id);
        }
      });
      this.allTrackingData
        .filter((f) => f.grouplabel >= 1)
        .forEach((d) => {
          const index = indexer.indexOf(d.grouplabel);
          if (index >= 0) {
            if (d.delivered) {
              if (d.delivereddate == 0) {
                if (d.status == 'returned') {
                  result[index].numberreturned++;
                } else {
                  result[index].numberlost++;
                }
              } else {
                result[index].numberdelivered++;

                // Find first delivered
                if (d.delivereddate > 1) {
                  if (result[index].firstdelivereddate > d.delivereddate) {
                    result[index].firstdelivereddate = d.delivereddate;
                  }
                }

                // Status check
                if (d.status.indexOf('door') >= 0 || d.status.indexOf('garage') >= 0) {
                  result[index].deliveredonground++;
                } else if (d.status.indexOf('locker') >= 0 || d.status.indexOf('mailbox') >= 0 || d.status.indexOf('PO Box') >= 0) {
                  result[index].deliveredinbox++;
                } else if (
                  d.status.indexOf('reception') >= 0 ||
                  d.status.indexOf('neighbor') >= 0 ||
                  d.status.indexOf('picked up at') >= 0 ||
                  d.status.indexOf('individual') >= 0
                ) {
                  result[index].deliveredtoperson++;
                } else {
                  result[index].deliveredunknown++;
                }
              }
            } else {
              result[index].numberinshipment++;
            }
          }
        });

      // Generate output
      let output = '';
      const youbi = ['日', '月', '火', '水', '木', '金', '土'];
      const todayDate = new Date(Date.now() + 9 * 60 * 60 * 1000); // Japanese local time
      output += `【${todayDate.getMonth() + 1}月${todayDate.getDate()}日（${youbi[todayDate.getDay()]}）】の更新は下記になります。<br><br>`;
      output += '<b>※変更無しのコンテナは背景灰色</b><br><b>※背景黒は追跡が始まっていません（追跡番号待ち）</b><br><br>■配達ステータス<br>';
      // Table: delivery status
      output += `
      <table style="width:100%;">
        <thead>
          <tr>
            <th style="width:16%;border:1px solid black;"></th>
            <th style="width:16%;border:1px solid black;">発到着日※１</th>
            <th style="width:16%;border:1px solid black;">配達済</th>
            <th style="width:16%;border:1px solid black;">配送中</th>
            <th style="width:16%;border:1px solid black;">返送件数</th>
            <th style="width:16%;border:1px solid black;">紛失件数※２</th>
          </tr>
        </thead>
        <tbody>`;
      result.forEach((r) => {
        const total = r.numberdelivered + r.numberinshipment + r.numberreturned + r.numberlost;
        output += `
        <tr>
          <td style="border:1px solid black;">${r.label}</td>
          <td style="border:1px solid black;">${new Date(r.firstdelivereddate).getMonth() + 1}月${new Date(
          r.firstdelivereddate
        ).getDate()}日</td>
          <td style="border:1px solid black;">${r.numberdelivered} (${Math.round((10000 * r.numberdelivered) / total) / 100}%)</td>
          <td style="border:1px solid black;">${r.numberinshipment} (${Math.round((10000 * r.numberinshipment) / total) / 100}%)</td>
          <td style="border:1px solid black;">${r.numberreturned} (${Math.round((10000 * r.numberreturned) / total) / 100}%)</td>
          <td style="border:1px solid black;">${r.numberlost} (${Math.round((10000 * r.numberlost) / total) / 100}%)</td>
        </tr>
        `;
      });
      output += `
        </tbody>
      </table>
      `;
      output += '※１【発到着日】はそのコンテナで初到着荷物の到着日です。<br>';
      output += '※２【紛失件数】は顧客から不着クレームがあり、AITから補償が決定したケースです。<br><br>';
      output += '■配達状況<br>';
      // Table: delivery method
      output += `
      <table style="width:100%;">
        <thead>
          <tr>
            <th style="width:20%;border:1px solid black;"></th>
            <th style="width:20%;border:1px solid black;">置き配の配達</th>
            <th style="width:20%;border:1px solid black;">ポストボックス・荷物ロッカー配達</th>
            <th style="width:20%;border:1px solid black;">受け付け・人に渡した</th>
            <th style="width:20%;border:1px solid black;">不明</th>
          </tr>
        </thead>
        <tbody>`;
      result.forEach((r) => {
        output += `
        <tr>
          <td style="border:1px solid black;">${r.label}</td>
          <td style="border:1px solid black;">${r.deliveredonground}</td>
          <td style="border:1px solid black;">${r.deliveredinbox}</td>
          <td style="border:1px solid black;">${r.deliveredtoperson}</td>
          <td style="border:1px solid black;">${r.deliveredunknown}</td>
        </tr>
        `;
      });
      output += `
        </tbody>
      </table>
      `;

      // Copy to clipboard
      function listener(e) {
        e.clipboardData.setData('text/html', output);
        e.clipboardData.setData('text/plain', output);
        e.preventDefault();
      }
      document.addEventListener('copy', listener);
      document.execCommand('copy');
      document.removeEventListener('copy', listener);

      // Show done message
      alert('Copied!');
    },
  },
};
</script>

<style scoped>
.delivered {
  color: rgb(199, 255, 143);
}
.delayed {
  color: rgb(169, 203, 241);
}
.returned {
  color: rgb(250, 214, 115);
}
.lost {
  color: rgb(255, 97, 97);
}
</style>
