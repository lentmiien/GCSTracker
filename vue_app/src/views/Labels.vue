<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <div class="section">
          <h2>Add label</h2>
          <input
            class="form-control"
            type="text"
            name="new_label"
            id="new_label"
          />
          <button class="btn btn-primary" v-on:click="add_new_label()">
            Add new label
          </button>
        </div>
        <table class="table table-dark table-striped">
          <thead style="position: sticky; top: 0; background-color: #888888">
            <tr>
              <th span="col">Label</th>
              <th span="col">*Not implemented</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="index" v-for="(entry, index) in grouplabels">
              <td>{{ entry.label }}</td>
              <td>
                <button class="btn btn-danger">Remove</button>
              </td>
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
  name: "Labels",
  data() {
    return {};
  },
  computed: mapGetters(["grouplabels"]),
  methods: {
    ...mapActions(["addLabel"]),
    add_new_label: function () {
      this.addLabel({ label: document.getElementById("new_label").value });
      document.getElementById("new_label").value = "";
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
