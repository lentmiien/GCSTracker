<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1>Label search</h1>
        <form @submit="analyzelabel">
          <label for="records">Label to analyze</label>
          <select name="records" id="records" v-model="label" required>
            <option value="-1" selected>All</option>
            <option :key="a.id" value="a.id" v-for="a in grouplabels">{{ a.label }}</option>
          </select>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
    <div class="row" v-if="display">
      <div class="col">
        <h1>Alert</h1>
        <p>{{ display.number }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";

export default {
  name: "Alert",
  data() {
    return {
      label: "",
      display: undefined,
    };
  },
  computed: mapGetters(["allTrackingData", "grouplabels"]),
  methods: {
    analyzelabel(e) {
      e.preventDefault();

      // Format data to send (from "label")
      const input_data = parseInt(this.label);

      // Acquire records
      const analyze_data = this.allTrackingData.filter(
        (d) => d.delivered === false && (input_data === -1 || d.grouplabel === input_data)
      );

      analyze_data.forEach((d) => {});

      // Process analysis
      this.display = { number: analyze_data.length };
    },
  },
};
</script>

<style scoped></style>
