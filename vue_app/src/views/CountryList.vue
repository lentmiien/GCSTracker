<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
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
import { mapGetters } from "vuex";

export default {
  name: "CountryList",
  data() {
    return {
      countries: [],
    };
  },
  computed: mapGetters(["countryToCode"]),
};
</script>

<style scoped></style>
