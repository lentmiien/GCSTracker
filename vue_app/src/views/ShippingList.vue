<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <button class="btn btn-primary form-control" v-on:click="copytable()">Zendesk table (copy)</button>
        <table class="table table-dark table-striped">
          <thead style="position:sticky;top:0;background-color:#888888;">
            <tr>
              <th span="col">Name</th>
              <th span="col">EMS</th>
              <th span="col">ASP</th>
              <th span="col">SAL SP Reg.</th>
              <th span="col">SAL SP Ureg.</th>
              <th span="col">SAL Parcel</th>
              <th span="col">DHL</th>
              <th span="col">Air Parcel</th>
            </tr>
          </thead>
          <tbody>
            <tr :key="index" v-for="(entry, index) in allShippingMethods">
              <td>{{ entry.country_name }}</td>
              <td>
                <select
                  :id="'ems_' + entry.country_name"
                  :class="'status' + entry.ems_available"
                  v-on:change="update('ems_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.ems_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.ems_available == 1">Available</option>
                  <option value="2" :selected="entry.ems_available == 2">Suspended</option>
                  <option value="3" :selected="entry.ems_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'airsp_' + entry.country_name"
                  :class="'status' + entry.airsp_available"
                  v-on:change="update('airsp_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.airsp_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.airsp_available == 1">Available</option>
                  <option value="2" :selected="entry.airsp_available == 2">Suspended</option>
                  <option value="3" :selected="entry.airsp_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'salspr_' + entry.country_name"
                  :class="'status' + entry.salspr_available"
                  v-on:change="update('salspr_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.salspr_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.salspr_available == 1">Available</option>
                  <option value="2" :selected="entry.salspr_available == 2">Suspended</option>
                  <option value="3" :selected="entry.salspr_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'salspu_' + entry.country_name"
                  :class="'status' + entry.salspu_available"
                  v-on:change="update('salspu_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.salspu_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.salspu_available == 1">Available</option>
                  <option value="2" :selected="entry.salspu_available == 2">Suspended</option>
                  <option value="3" :selected="entry.salspu_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'salp_' + entry.country_name"
                  :class="'status' + entry.salp_available"
                  v-on:change="update('salp_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.salp_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.salp_available == 1">Available</option>
                  <option value="2" :selected="entry.salp_available == 2">Suspended</option>
                  <option value="3" :selected="entry.salp_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'dhl_' + entry.country_name"
                  :class="'status' + entry.dhl_available"
                  v-on:change="update('dhl_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.dhl_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.dhl_available == 1">Available</option>
                  <option value="2" :selected="entry.dhl_available == 2">Suspended</option>
                  <option value="3" :selected="entry.dhl_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'airp_' + entry.country_name"
                  :class="'status' + entry.airp_available"
                  v-on:change="update('airp_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.airp_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.airp_available == 1">Available</option>
                  <option value="2" :selected="entry.airp_available == 2">Suspended</option>
                  <option value="3" :selected="entry.airp_available == 3">Blocked</option>
                </select>
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
  name: "ShippingList",
  data() {
    return {
      shippings: [],
    };
  },
  computed: mapGetters(["allShippingMethods"]),
  methods: {
    ...mapActions(["updateShippingRecord"]),
    update: function (this_id) {
      const element = document.getElementById(this_id);
      element.style.backgroundColor = "white";
      this.updateShippingRecord({ this_id, value: element.value });
    },
    copytable: function () {
      this.allShippingMethods.sort((a, b) => {
        if (a.country_name < b.country_name) {
          return -1;
        } else if (a.country_name > b.country_name) {
          return 1;
        } else {
          return 0;
        }
      });
      let text_str =
        '<table style="border-collapse: collapse; color: black; background-color: white;"><tbody>';
      let colorer = 0;
      this.allShippingMethods.forEach((c) => {
        if (colorer % 20 == 0) {
          text_str +=
            '<tr><th style="border: 1px solid black; width: 12%;">Country</th><th style="border: 1px solid black; width: 12%;">EMS</th><th style="border: 1px solid black; width: 12%;">Air Small Packet</th><th style="border: 1px solid black; width: 12%;">SAL Registered</th><th style="border: 1px solid black; width: 12%;">SAL Unregistered</th><th style="border: 1px solid black; width: 12%;">SAL Parcel</th><th style="border: 1px solid black; width: 12%;">DHL</th><th style="border: 1px solid black; width: 12%;">Air Parcel</th></tr>';
          colorer++;
        }
        text_str += `<tr style="background-color:${
          colorer % 2 == 0 ? "#FFFFFF" : "#EEEEEE"
        };"><td style="text-align: center; border: 1px solid black;">${
          c.country_name
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.ems_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.airsp_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.salspr_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.salspu_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.salp_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.dhl_available == 1 ? "〇" : ""
        }</td><td style="text-align: center; border: 1px solid black;">${
          c.airp_available == 1 ? "〇" : ""
        }</td></tr>`;
        colorer++;
      });
      text_str += "</tbody></table>";
      // const copyelement = document.createElement("textarea");
      // copyelement.value = text_str;
      // document.body.appendChild(copyelement);
      // copyelement.focus();
      // copyelement.select();
      // document.execCommand("copy");
      // copyelement.parentElement.removeChild(copyelement);

      function listener(e) {
        e.clipboardData.setData("text/html", text_str);
        e.clipboardData.setData("text/plain", text_str);
        e.preventDefault();
      }
      document.addEventListener("copy", listener);
      document.execCommand("copy");
      document.removeEventListener("copy", listener);
    },
  },
};
</script>

<style scoped>
.status0 {
  background-color: grey;
}
.status1 {
  background-color: green;
}
.status2 {
  background-color: yellow;
}
.status3 {
  background-color: red;
}
</style>
