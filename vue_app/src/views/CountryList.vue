<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="section" v-if="unknown_countries.length > 0">
          <h2>Unknown countries</h2>
          <div class="section_entry" :key="key" v-for="(entry, key) of unknown_countries">
            <div class="input-group">
              <div class="input-group-prepend">
                <span class="input-group-text">{{ entry }}</span>
              </div>
              <select :id="entry" class="form-control" v-on:change="update(entry)">
                <option
                  :value="e.country_code"
                  :key="k"
                  v-for="(e, k) of countryToCode"
                >{{ e.country_name }}</option>
              </select>
            </div>
          </div>
        </div>
        <table class="table table-dark table-striped">
          <thead style="position:sticky;top:0;background-color:#888888;">
            <tr>
              <th span="col">Code</th>
              <th span="col">Name</th>
              <th span="col">Base entry</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="index" v-for="(entry, index) in countryToCode">
              <td>{{ entry.country_code }}</td>
              <td>{{ entry.country_name }}</td>
              <td>{{ entry.baseentry ? '〇' : '' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "CountryList",
  data() {
    return {
      // countries: {},
      unknown_countries: [],
    };
  },
  computed: mapGetters(["countryToCode", "allTrackingData"]),
  created() {
    const countrynames = [];
    this.countryToCode.forEach((d) => {
      // this.countries[d.country_name] = d.country_code;
      countrynames.push(d.country_name);
    });
    this.allTrackingData.forEach((d) => {
      if (countrynames.indexOf(d.country) == -1) {
        this.unknown_countries.push(d.country);
      }
    });
  },
  methods: {
    ...mapActions(["addRecord"]),
    update: function (this_id) {
      const element = document.getElementById(this_id);
      element.style.backgroundColor = "green";
      this.addRecord({ country_name: this_id, country_code: element.value });
    },
  },
};
</script>

<style scoped>
.section {
  border: 1px solid white;
  border-radius: 5px;
}
.section_entry {
  margin: 5px;
  padding: 5px;
}
</style>
