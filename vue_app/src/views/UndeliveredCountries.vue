<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Country list data</h2>
        <table class="table table-dark table-striped">
          <thead>
            <tr>
              <th span="col">Country</th>
              <th span="col">DHL</th>
              <th span="col">EMS</th>
              <th span="col">Air/SAL</th>
              <th span="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr :key="entry.id" v-for="entry in countries">
              <td>
                <router-link :to="entry.link">{{ entry.country }}</router-link>
              </td>
              <td>{{ entry.dhl_count }}</td>
              <td>{{ entry.ems_count }}</td>
              <td>{{ entry.other_count }}</td>
              <td>
                <a class="download" :href="entry.downloadlink" v-if="entry.downloadlink">Download</a>
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

export default {
  name: "UndeliveredCountries",
  computed: mapGetters(["allTrackingData"]),
  data() {
    return {
      countries: [],
    };
  },
  created() {
    const notdoneTrackings = this.allTrackingData.filter(
      (d) => d.carrier != "INVALID" && !d.delivered
    );
    notdoneTrackings.forEach((d) => {
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
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&country=${d.country}&done=0`,
          dhl_count: 0,
          ems_count: 0,
          other_count: 0,
        });
      }
      if (d.carrier == "DHL") {
        this.countries[index].dhl_count++;
      } else if (d.tracking.indexOf("EM") == 0) {
        this.countries[index].ems_count++;
      } else {
        this.countries[index].other_count++;
      }
    });

    this.countries.sort((a, b) => {
      if (
        a.dhl_count + a.ems_count + a.other_count >
        b.dhl_count + b.ems_count + b.other_count
      ) {
        return -1;
      } else if (
        a.dhl_count + a.ems_count + a.other_count <
        b.dhl_count + b.ems_count + b.other_count
      ) {
        return 1;
      } else {
        return 0;
      }
    });
  },
};
</script>

<style></style>
