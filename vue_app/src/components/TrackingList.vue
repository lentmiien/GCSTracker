<template>
  <table class="table table-striped table-dark">
    <thead>
      <tr>
        <th scope="col">Tracking number</th>
        <th scope="col">Status</th>
        <th scope="col" colspan="3">Date</th>
      </tr>
    </thead>
    <tbody>
      <tr :key="entry.id" v-for="entry in data" :class="{ 'bg-success': entry.done }">
        <td>
          <router-link :to="detailslink(entry.tracking)">{{ entry.tracking }}</router-link>
        </td>
        <td>{{ entry.status }}</td>
        <td>{{ (new Date(entry.shippeddate)).toLocaleDateString('ja-JP') }}</td>
        <td>-</td>
        <td>{{ entry.delivereddate == 0 ? 'Not arrived' : (entry.shippeddate >= entry.delivereddate) ? 'Arrived' : (new Date(entry.delivereddate)).toLocaleDateString('ja-JP') }}</td>
      </tr>
    </tbody>
  </table>
</template>

<script>
export default {
  name: "TrackingList",
  props: ["data"],
  methods: {
    detailslink: function(tracking) {
      return `/trackingdetails?tracking=${tracking}`;
    }
  }
};
</script>

<style scoped></style>
