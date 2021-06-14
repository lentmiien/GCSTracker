<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <form @submit="processForm">
          <label for="records">Records to add</label>
          <textarea
            name="records"
            id="records"
            class="form-control"
            cols="30"
            rows="10"
            v-model="records"
            required
          ></textarea>
          <label for="date">Shipped date (default: Now)</label>
          <input
            type="date"
            name="date"
            id="date"
            class="form-control"
            v-model="timestamp"
          />
          <label for="label">Group label (default: none)</label>
          <select name="label" id="label" class="form-control" v-model="label">
            <option value="-1">none</option>
            <option :key="a.id" :value="a.id" v-for="a in grouplabels">
              {{ a.label }}
            </option>
          </select>
          <label for="country">Country (default: UNKNOWN)</label>
          <input
            type="text"
            name="country"
            id="country"
            class="form-control"
            v-model="country"
          />
          <input id="submit_button" class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "AddRecords",
  data() {
    return {
      records: "",
      timestamp: "",
      label: "",
      country: "",
    };
  },
  computed: mapGetters(["grouplabels"]),
  methods: {
    ...mapActions(["addRecords"]),
    processForm(e) {
      e.preventDefault();

      document.getElementById("submit_button").disabled = true;

      // Acquire default country
      let default_country = 'UNKNOWN';
      if (this.country.length > 0) {
        default_country = this.country;
        this.country = '';
      }

      // Format data to send (from "records")
      const input_data = this.records.split(/[\r\n]+/); // Split on new line characters
      const send_data = {
        records: [],
        timestamp: Date.now(),
        label: parseInt(this.label),
      };
      input_data.forEach((d) => {
        if (d.indexOf(",") > 0) {
          const data = d.split(",");
          send_data.records.push({
            id: data[0],
            country: data[1],
          });
        } else if (d.indexOf("\t") > 0) {
          const data = d.split("\t");
          send_data.records.push({
            id: data[2],
            country: "UNITED STATES",
          });
        } else {
          send_data.records.push({
            id: d,
            country: default_country,
          });
        }
      });

      // Process timestamp (if provided)
      if (this.timestamp.length > 0) {
        const datedata = this.timestamp.split("-");
        const unique_time = new Date();// Just to make every batch unique
        const datedate = new Date(
          parseInt(datedata[0]),
          parseInt(datedata[1]) - 1,
          parseInt(datedata[2]),
          unique_time.getHours(),
          unique_time.getMinutes(),
          unique_time.getSeconds(),
          unique_time.getMilliseconds(),
        );
        send_data.timestamp = datedate.getTime();
      }

      console.log(`Sending data to server, length=${send_data.records.length}`);
      // Send to server, and update local data
      this.addRecords(send_data).then(() => {
        document.getElementById("submit_button").disabled = false;
        this.records = "";
      });

      // Reset input
      // this.records = "";
    },
  },
};
</script>

<style scoped>
.notes {
  color: rgb(99, 99, 99);
}
</style>
