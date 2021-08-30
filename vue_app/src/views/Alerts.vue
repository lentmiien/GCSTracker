<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h2>Alerts</h2>
        <div v-if="data == null">Loading...</div>
        <div v-else>
          <form action="/api/verifytracking" method="post">
            <table class="table table-dark table-striped">
              <thead>
                <tr>
                  <th>Tracking</th>
                  <th>Alert</th>
                  <th>OK?</th>
                </tr>
              </thead>
              <tbody>
                <tr :key="key" v-for="(entry, key) of data">
                  <td>{{ entry.tracking }}</td>
                  <td>{{ entry.alert_message }}</td>
                  <td>
                    <input type="checkbox" :name="entry.tracking" :id="entry.tracking">
                  </td>
                </tr>
              </tbody>
            </table>
            <input class="btn btn-primary" type="submit" value="Submit">
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: "Alerts",
  data() {
    return {
      data: null
    };
  },
  created() {
    axios
      .get(`/api/alerts`)
      .then((result) => {
        if (result.data.length > 0) {
          this.data = result.data;
        }
      })
      .catch((err) => console.log(err));
  },
};
</script>

<style scoped></style>
