<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Country list data (last 90 days)</h2>
        <table class="table table-dark table-striped">
          <thead>
            <tr>
              <th span="col">Country</th>
              <th span="col">DHL</th>
              <th span="col">EMS</th>
              <th span="col">Air/SAL</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="entry.id" v-for="entry in countries">
              <td>
                <router-link :to="entry.link">{{ entry.country }}</router-link>
              </td>
              <td v-if="entry.dhl.count > 0">
                {{ entry.dhl.shortest }} -
                <b>{{ entry.dhl.averagedays }} days</b>
                - {{ entry.dhl.longest }}
              </td>
              <td v-else>-</td>
              <td v-if="entry.ems.count > 0">
                {{ entry.ems.shortest }} -
                <b>{{ entry.ems.averagedays }} days</b>
                - {{ entry.ems.longest }}
              </td>
              <td v-else>-</td>
              <td v-if="entry.other.count > 0">
                {{ entry.other.shortest }} -
                <b>{{ entry.other.averagedays }} days</b>
                - {{ entry.other.longest }}
              </td>
              <td v-else>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "DeliveredCountries90days",
  computed: mapGetters(["allTrackingData"]),
  data() {
    return {
      countries: []
    };
  },
  created() {
    const oneday = 86400000;
    const doneTrackings90 = this.allTrackingData.filter(
      d =>
        d.carrier != "INVALID" &&
        d.done &&
        d.delivereddate > Date.now() - 7776000000
    );
    doneTrackings90.forEach(d => {
      let index = -1;
      for (let i = 0; i < this.countries.length; i++) {
        if (this.countries[i].country == d.country) {
          index = i;
          break;
        }
      }
      if (index == -1) {
        index = this.countries.length;
        this.countries.push({
          id: index,
          country: d.country,
          link: `/countrydetails?country=${d.country}`,
          dhl: {
            count: 0,
            totaldays: 0,
            averagedays: 0,
            shortest: 9999,
            longest: 0
          },
          ems: {
            count: 0,
            totaldays: 0,
            averagedays: 0,
            shortest: 9999,
            longest: 0
          },
          other: {
            count: 0,
            totaldays: 0,
            averagedays: 0,
            shortest: 9999,
            longest: 0
          }
        });
      }
      const shipping_days = (d.delivereddate - d.shippeddate) / oneday;
      if (d.carrier == "DHL") {
        this.countries[index].dhl.count++;
        this.countries[index].dhl.totaldays += shipping_days;
        this.countries[index].dhl.averagedays =
          Math.round(
            (10 * this.countries[index].dhl.totaldays) /
              this.countries[index].dhl.count
          ) / 10;
        if (this.countries[index].dhl.shortest > shipping_days) {
          this.countries[index].dhl.shortest = Math.floor(shipping_days);
        }
        if (this.countries[index].dhl.longest < shipping_days) {
          this.countries[index].dhl.longest = Math.ceil(shipping_days);
        }
      } else if (d.tracking.indexOf("EM") == 0) {
        this.countries[index].ems.count++;
        this.countries[index].ems.totaldays += shipping_days;
        this.countries[index].ems.averagedays =
          Math.round(
            (10 * this.countries[index].ems.totaldays) /
              this.countries[index].ems.count
          ) / 10;
        if (this.countries[index].ems.shortest > shipping_days) {
          this.countries[index].ems.shortest = Math.floor(shipping_days);
        }
        if (this.countries[index].ems.longest < shipping_days) {
          this.countries[index].ems.longest = Math.ceil(shipping_days);
        }
      } else {
        this.countries[index].other.count++;
        this.countries[index].other.totaldays += shipping_days;
        this.countries[index].other.averagedays =
          Math.round(
            (10 * this.countries[index].other.totaldays) /
              this.countries[index].other.count
          ) / 10;
        if (this.countries[index].other.shortest > shipping_days) {
          this.countries[index].other.shortest = Math.floor(shipping_days);
        }
        if (this.countries[index].other.longest < shipping_days) {
          this.countries[index].other.longest = Math.ceil(shipping_days);
        }
      }
    });

    this.countries.sort((a, b) => {
      if (
        a.dhl.count + a.ems.count + a.other.count >
        b.dhl.count + b.ems.count + b.other.count
      ) {
        return -1;
      } else if (
        a.dhl.count + a.ems.count + a.other.count <
        b.dhl.count + b.ems.count + b.other.count
      ) {
        return 1;
      } else {
        return 0;
      }
    });
  }
};
</script>

<style></style>
