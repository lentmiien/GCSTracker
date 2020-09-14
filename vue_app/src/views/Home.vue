<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col-1"></div>
      <DataStatus />
      <div class="col-1"></div>
      <TrackingStatus />
      <div class="col-1"></div>
    </div>
    <div class="row mt-3">
      <div class="col">
        <h2>Undelivered count (rate)</h2>
        <table class="table table-striped table-dark">
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
            <tr>
              <td>
                <router-link :to="undelivered_count[0].link">{{ undelivered_count[0].label }}</router-link>
              </td>
              <td>{{ undelivered_count[0].dhl.count }} ({{ undelivered_count[0].dhl.rate }}%)</td>
              <td>{{ undelivered_count[0].ems.count }} ({{ undelivered_count[0].ems.rate }}%)</td>
              <td>{{ undelivered_count[0].other.count }} ({{ undelivered_count[0].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[0].downloadlink">Download</a>
              </td>
            </tr>
            <tr>
              <td>
                <router-link :to="undelivered_count[1].link">{{ undelivered_count[1].label }}</router-link>
              </td>
              <td>{{ undelivered_count[1].dhl.count }} ({{ undelivered_count[1].dhl.rate }}%)</td>
              <td>{{ undelivered_count[1].ems.count }} ({{ undelivered_count[1].ems.rate }}%)</td>
              <td>{{ undelivered_count[1].other.count }} ({{ undelivered_count[1].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[1].downloadlink">Download</a>
              </td>
            </tr>
            <tr>
              <td>
                <router-link :to="undelivered_count[2].link">{{ undelivered_count[2].label }}</router-link>
              </td>
              <td>{{ undelivered_count[2].dhl.count }} ({{ undelivered_count[2].dhl.rate }}%)</td>
              <td>{{ undelivered_count[2].ems.count }} ({{ undelivered_count[2].ems.rate }}%)</td>
              <td>{{ undelivered_count[2].other.count }} ({{ undelivered_count[2].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[2].downloadlink">Download</a>
              </td>
            </tr>
            <tr>
              <td>
                <router-link :to="undelivered_count[3].link">{{ undelivered_count[3].label }}</router-link>
              </td>
              <td>{{ undelivered_count[3].dhl.count }} ({{ undelivered_count[3].dhl.rate }}%)</td>
              <td>{{ undelivered_count[3].ems.count }} ({{ undelivered_count[3].ems.rate }}%)</td>
              <td>{{ undelivered_count[3].other.count }} ({{ undelivered_count[3].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[3].downloadlink">Download</a>
              </td>
            </tr>
            <tr class="t_blank_row">
              <td class="t_blank_row" colspan="5"></td>
            </tr>
            <tr>
              <td>
                <router-link :to="undelivered_count[4].link">{{ months[(new Date()).getMonth()] }}</router-link>
              </td>
              <td>{{ undelivered_count[4].dhl.count }} ({{ undelivered_count[4].dhl.rate }}%)</td>
              <td>{{ undelivered_count[4].ems.count }} ({{ undelivered_count[4].ems.rate }}%)</td>
              <td>{{ undelivered_count[4].other.count }} ({{ undelivered_count[4].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[4].downloadlink">Download</a>
              </td>
            </tr>
            <tr>
              <td>
                <router-link
                  :to="undelivered_count[5].link"
                >{{ months[(new Date()).getMonth()-1 >= 0 ? (new Date()).getMonth()-1 : (new Date()).getMonth()+11] }}</router-link>
              </td>
              <td>{{ undelivered_count[5].dhl.count }} ({{ undelivered_count[5].dhl.rate }}%)</td>
              <td>{{ undelivered_count[5].ems.count }} ({{ undelivered_count[5].ems.rate }}%)</td>
              <td>{{ undelivered_count[5].other.count }} ({{ undelivered_count[5].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[5].downloadlink">Download</a>
              </td>
            </tr>
            <tr>
              <td>
                <router-link
                  :to="undelivered_count[6].link"
                >{{ months[(new Date()).getMonth()-2 >= 0 ? (new Date()).getMonth()-2 : (new Date()).getMonth()+10] }}</router-link>
              </td>
              <td>{{ undelivered_count[6].dhl.count }} ({{ undelivered_count[6].dhl.rate }}%)</td>
              <td>{{ undelivered_count[6].ems.count }} ({{ undelivered_count[6].ems.rate }}%)</td>
              <td>{{ undelivered_count[6].other.count }} ({{ undelivered_count[6].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[6].downloadlink">Download</a>
              </td>
            </tr>
            <tr class="t_blank_row">
              <td class="t_blank_row" colspan="5"></td>
            </tr>
            <tr>
              <td>
                <router-link to="/undelivered">All</router-link>
              </td>
              <td>{{ undelivered_count[7].dhl.count }} ({{ undelivered_count[7].dhl.rate }}%)</td>
              <td>{{ undelivered_count[7].ems.count }} ({{ undelivered_count[7].ems.rate }}%)</td>
              <td>{{ undelivered_count[7].other.count }} ({{ undelivered_count[7].other.rate }}%)</td>
              <td>
                <a class="download" :href="undelivered_count[7].downloadlink">Download</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import DataStatus from "../components/DataStatus.vue";
import TrackingStatus from "../components/TrackingStatus.vue";

export default {
  name: "Home",
  components: {
    DataStatus,
    TrackingStatus,
  },
  data() {
    const now = Date.now();
    const oneday = 86400000;
    const d = new Date(now);
    const month_change = {
      this_month_start: new Date(
        d.getFullYear(),
        d.getMonth(),
        1,
        0,
        0,
        0,
        0
      ).getTime(),
      last_month_start: new Date(
        d.getFullYear(),
        d.getMonth() - 1,
        1,
        0,
        0,
        0,
        0
      ).getTime(),
      lastlast_month_start: new Date(
        d.getFullYear(),
        d.getMonth() - 2,
        1,
        0,
        0,
        0,
        0
      ).getTime(),
    };

    return {
      months: [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ],
      undelivered_count: [
        {
          label: "Last 7 days",
          link: `/undelivered?start=${now - oneday * 7}&end=${now}`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${
            now - oneday * 7
          }&shippedto=${now}&done=0`,
          start: now - oneday * 7,
          end: now,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "7-30 days ago",
          link: `/undelivered?start=${now - oneday * 30}&end=${
            now - oneday * 7
          }`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${
            now - oneday * 30
          }&shippedto=${now - oneday * 7}&done=0`,
          start: now - oneday * 30,
          end: now - oneday * 7,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "30-90 days ago",
          link: `/undelivered?start=${now - oneday * 90}&end=${
            now - oneday * 30
          }`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${
            now - oneday * 90
          }&shippedto=${now - oneday * 30}&done=0`,
          start: now - oneday * 90,
          end: now - oneday * 30,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "More than 90 days ago",
          link: `/undelivered?start=${0}&end=${now - oneday * 90}`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${0}&shippedto=${
            now - oneday * 90
          }&done=0`,
          start: 0,
          end: now - oneday * 90,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "This month",
          link: `/undelivered?start=${month_change.this_month_start}&end=${now}`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${month_change.this_month_start}&shippedto=${now}&done=0`,
          start: month_change.this_month_start,
          end: now,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "Last month",
          link: `/undelivered?start=${month_change.last_month_start}&end=${month_change.this_month_start}`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${month_change.last_month_start}&shippedto=${month_change.this_month_start}&done=0`,
          start: month_change.last_month_start,
          end: month_change.this_month_start,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "Last last month",
          link: `/undelivered?start=${month_change.lastlast_month_start}&end=${month_change.last_month_start}`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${month_change.lastlast_month_start}&shippedto=${month_change.last_month_start}&done=0`,
          start: month_change.lastlast_month_start,
          end: month_change.last_month_start,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
        {
          label: "All",
          link: `/undelivered`,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&shippedfrom=${0}&shippedto=${now}&done=0`,
          start: 0,
          end: now,
          dhl: {
            count: 0,
            rate: 0,
          },
          ems: {
            count: 0,
            rate: 0,
          },
          other: {
            count: 0,
            rate: 0,
          },
        },
      ],
    };
  },
  computed: mapGetters(["allTrackingData"]),
  methods: {
    updater: function () {
      const allTrackings = this.allTrackingData.filter(
        (d) => d.carrier != "INVALID"
      );
      if (allTrackings.length == 0) {
        setTimeout(this.updater, 1000);
      } else {
        this.undelivered_count.forEach((uc) => {
          const total_count = {
            dhl: 0,
            ems: 0,
            other: 0,
          };
          allTrackings.forEach((d) => {
            if (d.shippeddate > uc.start && uc.end >= d.shippeddate) {
              if (d.carrier == "DHL") {
                total_count.dhl++;
                if (d.delivered == false) {
                  uc.dhl.count++;
                }
              }
              if (d.tracking.indexOf("EM") == 0) {
                total_count.ems++;
                if (d.delivered == false) {
                  uc.ems.count++;
                }
              }
              if (d.tracking.indexOf("EM") != 0 && d.carrier != "DHL") {
                total_count.other++;
                if (d.delivered == false) {
                  uc.other.count++;
                }
              }
            }
          });
          uc.dhl.rate =
            Math.round(
              (uc.dhl.count / (total_count.dhl == 0 ? 1 : total_count.dhl)) *
                1000
            ) / 10;
          uc.ems.rate =
            Math.round(
              (uc.ems.count / (total_count.ems == 0 ? 1 : total_count.ems)) *
                1000
            ) / 10;
          uc.other.rate =
            Math.round(
              (uc.other.count /
                (total_count.other == 0 ? 1 : total_count.other)) *
                1000
            ) / 10;
        });
      }
    },
  },
  created() {
    this.updater();
  },
};
</script>

<style scoped>
</style>
