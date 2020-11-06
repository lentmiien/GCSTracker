<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <form @submit="processForm">
          <label for="records">Records to update</label>
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
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from "vuex";

export default {
  name: "UpdateRecords",
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
    ...mapActions(["updateRecords"]),
    processForm(e) {
      e.preventDefault();

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
        country: default_country,
      };
      input_data.forEach((d) => {
        if (d.indexOf(",") > 0) {
          const data = d.split(",");
          send_data.records.push({
            id: data[0],
          });
        } else if (d.indexOf("\t") > 0) {
          const data = d.split("\t");
          send_data.records.push({
            id: data[2],
          });
        } else {
          send_data.records.push({
            id: d,
          });
        }
      });

      // Process timestamp (if provided)
      if (this.timestamp.length > 0) {
        const datedata = this.timestamp.split("-");
        const datedate = new Date(
          parseInt(datedata[0]),
          parseInt(datedata[1]) - 1,
          parseInt(datedata[2])
        );
        send_data.timestamp = datedate.getTime();
      }

      // Send to server, and update local data
      this.updateRecords(send_data).then(() => this.records = "");

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
