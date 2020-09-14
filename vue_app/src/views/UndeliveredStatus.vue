<template>
  <div class="container-fluid">
    <div class="row mt-3">
      <div class="col">
        <h2>Status list data</h2>
        <table class="table table-dark table-striped">
          <thead>
            <tr>
              <th span="col">Status</th>
              <th span="col">Count</th>
              <th span="col"></th>
            </tr>
          </thead>
          <tbody>
            <tr :key="entry.id" v-for="entry in statuses">
              <td>{{ entry.status }}</td>
              <td>{{ entry.count }}</td>
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
  name: "UndeliveredStatus",
  computed: mapGetters(["allTrackingData"]),
  data() {
    return {
      statuses: [],
    };
  },
  created() {
    // Count all statuses
    const notdoneTrackings = this.allTrackingData.filter(
      (d) => d.carrier != "INVALID" && !d.delivered
    );
    notdoneTrackings.forEach((d) => {
      let index = -1;
      for (let i = 0; i < this.statuses.length; i++) {
        if (this.statuses[i].status == d.status) {
          index = i;
          break;
        }
      }
      if (index == -1) {
        index = this.statuses.length;
        this.statuses.push({
          id: index,
          status: d.status,
          downloadlink: `/api/getcsv?columns=tracking,country,status,shippeddate&status=${d.status}`,
          count: 0,
        });
      }
      this.statuses[index].count++;
    });

    // Sort more counts at top
    this.statuses.sort((a, b) => {
      if (a.count > b.count) {
        return -1;
      } else if (a.count < b.count) {
        return 1;
      } else {
        return 0;
      }
    });

    // Replace all 1 count entries with an "other" entry
    const original_length = this.statuses.length;
    this.statuses = this.statuses.filter((d) => d.count > 1);
    this.statuses.push({
      id: original_length,
      status: "Other",
      count: original_length - this.statuses.length,
    });
  },
};
</script>

<style></style>
