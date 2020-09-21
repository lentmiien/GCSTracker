<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <form @submit="processForm">
          <label for="records">Records to add</label>
          <i class="notes">
            <br />tracking1,country1
            <br />tracking2,country2
            <br />
            <br />OR
            <br />
            <br />tracking1
            <br />tracking2
          </i>
          <textarea class="form-control" cols="30" rows="10" v-model="records" required></textarea>
          <input class="btn btn-primary" type="submit" value="Submit" />
        </form>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
  name: "AddRecords",
  data() {
    return {
      records: "",
    };
  },
  methods: {
    ...mapActions(["addRecords"]),
    processForm(e) {
      e.preventDefault();

      // Format data to send (from "records")
      const input_data = this.records.split(/[\r\n]+/); // Split on new line characters
      const send_data = { records: [], timestamp: Date.now() };
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
          /*TEST DATA
3114		4209080592612927005542000000142984	4209080592612927005542000000142984		US
3114		4200711192612927005542000000115452	4200711192612927005542000000115452		US
          */
        } else {
          send_data.records.push({
            id: d,
            country: "UNKNOWN",
          });
        }
      });

      // Send to server, and update local data
      this.addRecords(send_data);

      // Reset input
      this.records = "";
    },
  },
};
</script>

<style scoped>
.notes {
  color: rgb(99, 99, 99);
}
</style>
