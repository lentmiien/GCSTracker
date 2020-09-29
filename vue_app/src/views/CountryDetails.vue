<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Country details for {{ $route.query.country }}</h2>
        <p>
          (
          <b class="delivered">Delivered</b>, <b class="delayed">Delayed</b>, <b class="returned">Returned</b>, <b class="lost">Lost</b>)
        </p>
        <table class="table table-dark table-striped">
          <thead>
            <tr>
              <th span="col"></th>
              <th span="col">DHL</th>
              <th span="col">EMS</th>
              <th span="col">Air/SAL</th>
              <th span="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr class="t_blank_row">
              <td class="t_blank_row" colspan="5"></td>
            </tr>
            <tr :key="index" v-for="(data, index) in data_count.slice(0, 4)">
              <td>{{ data.label }}</td>
              <td>
                {{ data.dhl.count }} ( <b class="delivered">{{ data.dhl.delivered }}%</b>, <b class="delayed">{{ data.dhl.delayed }}%</b>,
                <b class="returned">{{ data.dhl.returned }}%</b>, <b class="lost">{{ data.dhl.lost }}%</b>)
              </td>
              <td>
                {{ data.ems.count }} ( <b class="delivered">{{ data.ems.delivered }}%</b>, <b class="delayed">{{ data.ems.delayed }}%</b>,
                <b class="returned">{{ data.ems.returned }}%</b>, <b class="lost">{{ data.ems.lost }}%</b>)
              </td>
              <td>
                {{ data.other.count }} ( <b class="delivered">{{ data.other.delivered }}%</b>,
                <b class="delayed">{{ data.other.delayed }}%</b>, <b class="returned">{{ data.other.returned }}%</b>,
                <b class="lost">{{ data.other.lost }}%</b>)
              </td>
              <td>
                <a class="download" :href="data.downloadlink">Download</a>
              </td>
            </tr>
            <tr class="t_blank_row">
              <td class="t_blank_row" colspan="5"></td>
            </tr>
            <tr :key="index" v-for="(data, index) in data_count.slice(4, 7)">
              <td>{{ months[data.month_number] }}</td>
              <td>
                {{ data.dhl.count }} ( <b class="delivered">{{ data.dhl.delivered }}%</b>, <b class="delayed">{{ data.dhl.delayed }}%</b>,
                <b class="returned">{{ data.dhl.returned }}%</b>, <b class="lost">{{ data.dhl.lost }}%</b>)
              </td>
              <td>
                {{ data.ems.count }} ( <b class="delivered">{{ data.ems.delivered }}%</b>, <b class="delayed">{{ data.ems.delayed }}%</b>,
                <b class="returned">{{ data.ems.returned }}%</b>, <b class="lost">{{ data.ems.lost }}%</b>)
              </td>
              <td>
                {{ data.other.count }} ( <b class="delivered">{{ data.other.delivered }}%</b>,
                <b class="delayed">{{ data.other.delayed }}%</b>, <b class="returned">{{ data.other.returned }}%</b>,
                <b class="lost">{{ data.other.lost }}%</b>)
              </td>
              <td>
                <a class="download" :href="data.downloadlink">Download</a>
              </td>
            </tr>
            <tr class="t_blank_row">
              <td class="t_blank_row" colspan="5"></td>
            </tr>
            <tr :key="index" v-for="(data, index) in data_count.slice(7, 8)">
              <td>{{ data.label }}</td>
              <td>
                {{ data.dhl.count }} ( <b class="delivered">{{ data.dhl.delivered }}%</b>, <b class="delayed">{{ data.dhl.delayed }}%</b>,
                <b class="returned">{{ data.dhl.returned }}%</b>, <b class="lost">{{ data.dhl.lost }}%</b>)
              </td>
              <td>
                {{ data.ems.count }} ( <b class="delivered">{{ data.ems.delivered }}%</b>, <b class="delayed">{{ data.ems.delayed }}%</b>,
                <b class="returned">{{ data.ems.returned }}%</b>, <b class="lost">{{ data.ems.lost }}%</b>)
              </td>
              <td>
                {{ data.other.count }} ( <b class="delivered">{{ data.other.delivered }}%</b>,
                <b class="delayed">{{ data.other.delayed }}%</b>, <b class="returned">{{ data.other.returned }}%</b>,
                <b class="lost">{{ data.other.lost }}%</b>)
              </td>
              <td>
                <a class="download" :href="data.downloadlink">Download</a>
              </td>
            </tr>
          </tbody>
        </table>
        <div>
          <span style="color: black; background-color: steelblue; padding: 5px;">Shipped</span>
          <span style="color: black; background-color: grey; padding: 5px; margin-left:2px">Shipping</span>
          <span style="color: black; background-color: green; padding: 5px; margin-left:2px">Delivered</span>
          <span style="color: black; background-color: orange; padding: 5px; margin-left:2px">Returned</span>
          <span style="color: black; background-color: red; padding: 5px; margin-left:2px">Lost</span>
          <span style="color: white; border: 3px solid orange; padding: 5px; margin-left:10px">DHL</span>
          <span style="color: white; border: 3px solid red; padding: 5px; margin-left:2px">EMS</span>
          <span style="color: white; border: 3px solid white; padding: 5px; margin-left:2px">Air/SAL</span>
        </div>
        <div id="graph_area"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import * as d3 from 'd3';

export default {
  name: 'CountryDetails',
  computed: mapGetters(['allTrackingData']),
  data() {
    const country = this.$route.query.country;
    const now = Date.now();
    const oneday = 86400000;
    const d = new Date(now);
    const month_change = {
      this_month_start: new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0).getTime(),
      last_month_start: new Date(d.getFullYear(), d.getMonth() - 1, 1, 0, 0, 0, 0).getTime(),
      lastlast_month_start: new Date(d.getFullYear(), d.getMonth() - 2, 1, 0, 0, 0, 0).getTime(),
    };

    return {
      months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
      data_count: [
        {
          label: 'Last 7 days',
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${now -
            oneday * 7}&shippedto=${now}&country=${country}`,
          start: now - oneday * 7,
          end: now,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: '7-30 days ago',
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${now -
            oneday * 30}&shippedto=${now - oneday * 7}&country=${country}`,
          start: now - oneday * 30,
          end: now - oneday * 7,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: '30-90 days ago',
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${now -
            oneday * 90}&shippedto=${now - oneday * 30}&country=${country}`,
          start: now - oneday * 90,
          end: now - oneday * 30,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: 'More than 90 days ago',
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${0}&shippedto=${now -
            oneday * 90}&country=${country}`,
          start: 0,
          end: now - oneday * 90,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: 'This month',
          month_number: d.getMonth(),
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${month_change.this_month_start}&shippedto=${now}&country=${country}`,
          start: month_change.this_month_start,
          end: now,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: 'Last month',
          month_number: d.getMonth() > 1 ? d.getMonth() - 1 : 11,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${month_change.last_month_start}&shippedto=${month_change.this_month_start}&country=${country}`,
          start: month_change.last_month_start,
          end: month_change.this_month_start,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: 'Last last month',
          month_number: d.getMonth() > 2 ? d.getMonth() - 2 : d.getMonth() + 10,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${month_change.lastlast_month_start}&shippedto=${month_change.last_month_start}&country=${country}`,
          start: month_change.lastlast_month_start,
          end: month_change.last_month_start,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
        {
          label: 'All',
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate,delivereddate,done&shippedfrom=${0}&shippedto=${now}&country=${country}`,
          start: 0,
          end: now,
          dhl: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          ems: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
          other: {
            count: 0,
            delivered: 0,
            delayed: 0,
            returned: 0,
            lost: 0,
          },
        },
      ],
      graph_data: [],
      countrydata: [],
    };
  },
  methods: {
    updater: function() {
      this.countrydata = this.allTrackingData.filter((d) => d.carrier != 'INVALID' && d.country == this.$route.query.country);

      this.data_count.forEach((uc) => {
        this.countrydata.forEach((d) => {
          const update_values = {
            delivered: d.delivered && d.delivereddate > 0 ? 1 : 0,
            delayed: !d.delivered ? 1 : 0,
            returned: d.delivered && d.delivereddate == 0 && d.status == 'returned' ? 1 : 0,
            lost: d.delivered && d.delivereddate == 0 && d.status == 'lost' ? 1 : 0,
          };
          if (d.shippeddate > uc.start && uc.end >= d.shippeddate) {
            if (d.carrier == 'DHL') {
              uc.dhl.count++;
              uc.dhl.delivered += update_values.delivered;
              uc.dhl.delayed += update_values.delayed;
              uc.dhl.returned += update_values.returned;
              uc.dhl.lost += update_values.lost;
            }
            if (d.tracking.indexOf('EM') == 0) {
              uc.ems.count++;
              uc.ems.delivered += update_values.delivered;
              uc.ems.delayed += update_values.delayed;
              uc.ems.returned += update_values.returned;
              uc.ems.lost += update_values.lost;
            }
            if (d.tracking.indexOf('EM') != 0 && d.carrier != 'DHL') {
              uc.other.count++;
              uc.other.delivered += update_values.delivered;
              uc.other.delayed += update_values.delayed;
              uc.other.returned += update_values.returned;
              uc.other.lost += update_values.lost;
            }
          }
        });
        let denom = (uc.dhl.count == 0 ? 1 : uc.dhl.count) / 10000;
        uc.dhl.delivered = Math.round(uc.dhl.delivered / denom) / 100;
        uc.dhl.delayed = Math.round(uc.dhl.delayed / denom) / 100;
        uc.dhl.returned = Math.round(uc.dhl.returned / denom) / 100;
        uc.dhl.lost = Math.round(uc.dhl.lost / denom) / 100;

        denom = (uc.ems.count == 0 ? 1 : uc.ems.count) / 10000;
        uc.ems.delivered = Math.round(uc.ems.delivered / denom) / 100;
        uc.ems.delayed = Math.round(uc.ems.delayed / denom) / 100;
        uc.ems.returned = Math.round(uc.ems.returned / denom) / 100;
        uc.ems.lost = Math.round(uc.ems.lost / denom) / 100;

        denom = (uc.other.count == 0 ? 1 : uc.other.count) / 10000;
        uc.other.delivered = Math.round(uc.other.delivered / denom) / 100;
        uc.other.delayed = Math.round(uc.other.delayed / denom) / 100;
        uc.other.returned = Math.round(uc.other.returned / denom) / 100;
        uc.other.lost = Math.round(uc.other.lost / denom) / 100;
      });
    },
    drawgraph: function() {
      // SVG stuff
      let data = this.graph_data;
      // set the dimensions and margins of the graph
      var margin = { top: 20, right: 20, bottom: 30, left: 40 },
        width = 960 - margin.left - margin.right,
        height = 500 - margin.top - margin.bottom;

      // set the ranges
      var x = d3
        .scaleBand()
        .range([0, width])
        .padding(0.1);
      var y = d3.scaleLinear().range([height, 0]);

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

      // Scale the range of the data in the domains
      x.domain(
        data.map(function(d, i) {
          return i;
        })
      );
      y.domain([
        0,
        d3.max(data, function(d) {
          return d.shipped + d.shipping + d.delivered + d.returned + d.lost;
        }),
      ]);

      // append the rectangles for the bar chart
      svg
        .selectAll('.lost')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'lost')
        .attr('fill', 'red')
        .attr('x', function(d, i) {
          return x(i);
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
          return y(d.shipped + d.shipping + d.delivered + d.returned + d.lost);
        })
        .attr('height', function(d) {
          return height - y(d.shipped + d.shipping + d.delivered + d.returned + d.lost);
        });
      // append the rectangles for the bar chart
      svg
        .selectAll('.returned')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'returned')
        .attr('fill', 'orange')
        .attr('x', function(d, i) {
          return x(i);
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
          return y(d.shipped + d.shipping + d.delivered + d.returned);
        })
        .attr('height', function(d) {
          return height - y(d.shipped + d.shipping + d.delivered + d.returned);
        });
      // append the rectangles for the bar chart
      svg
        .selectAll('.shipped')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'shipped')
        .attr('fill', 'steelblue')
        .attr('x', function(d, i) {
          return x(i);
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
          return y(d.shipped + d.shipping + d.delivered);
        })
        .attr('height', function(d) {
          return height - y(d.shipped + d.shipping + d.delivered);
        });
      // append the rectangles for the bar chart
      svg
        .selectAll('.shipping')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'shipping')
        .attr('fill', 'grey')
        .attr('x', function(d, i) {
          return x(i);
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
          return y(d.shipping + d.delivered);
        })
        .attr('height', function(d) {
          return height - y(d.shipping + d.delivered);
        });
      // append the rectangles for the bar chart
      svg
        .selectAll('.delivered')
        .data(data)
        .enter()
        .append('rect')
        .attr('class', 'delivered')
        .attr('fill', 'green')
        .attr('x', function(d, i) {
          return x(i);
        })
        .attr('width', x.bandwidth())
        .attr('y', function(d) {
          return y(d.delivered);
        })
        .attr('height', function(d) {
          return height - y(d.delivered);
        });

      // add the x Axis
      svg
        .append('g')
        .attr('transform', 'translate(0,' + height + ')')
        .call(d3.axisBottom(x));

      // add the y Axis
      svg.append('g').call(d3.axisLeft(y));

      // Average lines
      y.domain([
        0,
        d3.max(data, function(d) {
          return d3.max([d.shipping_time.dhl.averagedays, d.shipping_time.ems.averagedays, d.shipping_time.other.averagedays]);
        }),
      ]);

      // Add the line
      svg
        .append('path')
        .datum(data)
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
              return y(d.shipping_time.dhl.averagedays);
            })
        );
      // Add the line
      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 3)
        .attr(
          'd',
          d3
            .line()
            .x(function(d, i) {
              return x(i);
            })
            .y(function(d) {
              return y(d.shipping_time.ems.averagedays);
            })
        );
      // Add the line
      svg
        .append('path')
        .datum(data)
        .attr('fill', 'none')
        .attr('stroke', 'white')
        .attr('stroke-width', 3)
        .attr(
          'd',
          d3
            .line()
            .x(function(d, i) {
              return x(i);
            })
            .y(function(d) {
              return y(d.shipping_time.other.averagedays);
            })
        );

      // add the y Axis
      svg.append('g').call(d3.axisRight(y));
    },
    grapher: function() {
      const oneday = 1000 * 60 * 60 * 24;
      const one_week = oneday * 7;
      const today = new Date();
      const start_week0 = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay(), 0, 0, 0, 0).getTime();
      this.countrydata.forEach((d) => {
        let week_start = start_week0;
        let week_end = start_week0 + one_week;
        let counter = 0;
        while (d.shippeddate < week_end) {
          if (counter + 1 > this.graph_data.length) {
            this.graph_data.push({
              shipped: 0,
              shipping: 0,
              delivered: 0,
              returned: 0,
              lost: 0,
              shipping_time: {
                dhl: {
                  count: 0,
                  totaldays: 0,
                  averagedays: 0,
                },
                ems: {
                  count: 0,
                  totaldays: 0,
                  averagedays: 0,
                },
                other: {
                  count: 0,
                  totaldays: 0,
                  averagedays: 0,
                },
              },
            });
          }

          if (d.status == 'Returned') {
            if (d.shippeddate >= week_start && d.shippeddate < week_end) {
              this.graph_data[counter].returned++;
            }
          } else if (d.status == 'Lost') {
            if (d.shippeddate >= week_start && d.shippeddate < week_end) {
              this.graph_data[counter].lost++;
            }
          } else {
            // Shipped
            if (d.shippeddate >= week_start && d.shippeddate < week_end && (d.delivereddate >= week_end || d.delivereddate <= 1)) {
              this.graph_data[counter].shipped++;
            }

            // Shipping
            if (d.shippeddate < week_start && (d.delivereddate >= week_end || d.delivereddate == 0)) {
              this.graph_data[counter].shipping++;
            }

            // Delivered
            if (d.delivereddate >= week_start && d.delivereddate < week_end) {
              this.graph_data[counter].delivered++;

              const days = (d.delivereddate - d.shippeddate) / oneday;
              if (d.carrier == 'DHL') {
                this.graph_data[counter].shipping_time.dhl.count++;
                this.graph_data[counter].shipping_time.dhl.totaldays += days;
                this.graph_data[counter].shipping_time.dhl.averagedays =
                  this.graph_data[counter].shipping_time.dhl.totaldays / this.graph_data[counter].shipping_time.dhl.count;
              } else if (d.tracking.indexOf('EM') == 0) {
                this.graph_data[counter].shipping_time.ems.count++;
                this.graph_data[counter].shipping_time.ems.totaldays += days;
                this.graph_data[counter].shipping_time.ems.averagedays =
                  this.graph_data[counter].shipping_time.ems.totaldays / this.graph_data[counter].shipping_time.ems.count;
              } else {
                this.graph_data[counter].shipping_time.other.count++;
                this.graph_data[counter].shipping_time.other.totaldays += days;
                this.graph_data[counter].shipping_time.other.averagedays =
                  this.graph_data[counter].shipping_time.other.totaldays / this.graph_data[counter].shipping_time.other.count;
              }
            }
          }

          week_end = week_start;
          week_start -= one_week;
          counter++;
        }
      });

      setTimeout(this.drawgraph, 1000);
    },
  },
  created() {
    this.updater();
    this.grapher();
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
