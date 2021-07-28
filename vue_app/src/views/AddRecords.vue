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
          <input class="btn btn-primary" type="submit" value="Queue items" />
        </form>
        <div :v-if="data_to_send.length > 0">
          <p id='queue_label'>{{ data_to_send.length }} queued items... (Recommended: max ~6000)</p>
          <button id="submit_button" class="btn btn-primary" @click="SendToServer">Send to server</button>
        </div>
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
      data_to_send: [],
    };
  },
  computed: mapGetters(["grouplabels"]),
  methods: {
    ...mapActions(["addRecords"]),
    processForm(e) {
      e.preventDefault();

      // Acquire default country
      let default_country = 'UNKNOWN';
      if (this.country.length > 0) {
        default_country = this.country;
        this.country = '';
      }

      // Process timestamp (if provided)
      let default_ts = Date.now();
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
        default_ts = datedate.getTime();
      }

      // Format data to send (from "records")
      const input_data = this.records.split(/[\r\n]+/); // Split on new line characters
      const label_id = parseInt(this.label);
      input_data.forEach((d) => {
        if (d.indexOf(",") > 0) {
          const data = d.split(",");
          this.data_to_send.push({
            id: data[0],
            ship_dts: default_ts,
            label: label_id,
            country: data[1],
          });
        } else if (d.indexOf("\t") > 0) {
          const data = d.split("\t");
          this.data_to_send.push({
            id: data[2],
            ship_dts: default_ts,
            label: label_id,
            country: "UNITED STATES",
          });
        } else {
          this.data_to_send.push({
            id: d,
            ship_dts: default_ts,
            label: label_id,
            country: default_country,
          });
        }
      });

      // Empty input field
      this.records = "";
    },
    SendToServer() {
      if(this.data_to_send.length > 0) {
        document.getElementById("submit_button").disabled = true;
        this.addRecords({ records: this.data_to_send }).then(() => {
          document.getElementById("submit_button").disabled = false;
          this.data_to_send = [];
        });
      }
    },
  },
};
</script>

<style scoped>
.notes {
  color: rgb(99, 99, 99);
}
</style>
