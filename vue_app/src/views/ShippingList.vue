<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <button class="btn btn-primary form-control" v-on:click="copytable()">Zendesk table (copy)</button>
        <button class="btn btn-primary form-control" v-on:click="copynomethods()">No available shipping methods (copy)</button>
        <a class="btn btn-primary form-control" href="/api/shipping_country_csv">Shipping method csv</a>
        <table class="table table-dark table-striped">
          <thead class="sticky-top" style="background-color:#888888;">
            <tr>
              <th span="col">Name</th>
              <th span="col">EMS</th>
              <th span="col">ASP</th>
              <th span="col">SAL SP Reg.</th>
              <th span="col">SAL SP Ureg.</th>
              <th span="col">SAL Parcel</th>
              <th span="col">DHL</th>
              <th span="col">Air Parcel</th>
              <th span="col">ASP Ureg.</th>
              <th span="col">Surface Parcel</th>
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
              <td>
                <select
                  :id="'airspu_' + entry.country_name"
                  :class="'status' + entry.airspu_available"
                  v-on:change="update('airspu_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.airspu_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.airspu_available == 1">Available</option>
                  <option value="2" :selected="entry.airspu_available == 2">Suspended</option>
                  <option value="3" :selected="entry.airspu_available == 3">Blocked</option>
                </select>
              </td>
              <td>
                <select
                  :id="'sp_' + entry.country_name"
                  :class="'status' + entry.sp_available"
                  v-on:change="update('sp_' + entry.country_name)"
                >
                  <option value="0" :selected="entry.sp_available == 0">Unavailable</option>
                  <option value="1" :selected="entry.sp_available == 1">Available</option>
                  <option value="2" :selected="entry.sp_available == 2">Suspended</option>
                  <option value="3" :selected="entry.sp_available == 3">Blocked</option>
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
import { mapGetters, mapActions } from 'vuex';

export default {
  name: 'ShippingList',
  data() {
    return {
      shippings: [],
    };
  },
  computed: mapGetters(['allShippingMethods']),
  methods: {
    ...mapActions(['updateShippingRecord']),
    update: function(this_id) {
      const element = document.getElementById(this_id);
      element.style.backgroundColor = 'white';
      this.updateShippingRecord({ this_id, value: element.value });
    },
    copytable: function() {
      this.allShippingMethods.sort((a, b) => {
        if (a.country_name < b.country_name) {
          return -1;
        } else if (a.country_name > b.country_name) {
          return 1;
        } else {
          return 0;
        }
      });
      let text_str = '<table style="border-collapse: collapse; color: black; background-color: white;"><tbody>';
      let colorer = 0;
      this.allShippingMethods.forEach((c) => {
        // Fill in header every 20th row
        if (colorer % 20 == 0) {
          text_str +=
            '<tr><th style="border: 1px solid black; width: 10%;">Country</th><th style="border: 1px solid black; width: 9%;">EMS</th><th style="border: 1px solid black; width: 9%;">DHL</th><th style="border: 1px solid black; width: 9%;">Air Small Packet Registered</th><th style="border: 1px solid black; width: 9%;">Air Small Packet Unregistered</th><th style="border: 1px solid black; width: 9%;">Air Parcel</th><th style="border: 1px solid black; width: 9%;">SAL Registered</th><th style="border: 1px solid black; width: 9%;">SAL Unregistered</th><th style="border: 1px solid black; width: 9%;">SAL Parcel</th><th style="border: 1px solid black; width: 9%;">Surface Parcel</th><th style="border: 1px solid black; width: 9%;">Other</th></tr>';
          colorer++;
        }

        // Determin if and what other methods that are available
        let other = '';
        if (c.country_name == 'UNITED STATES') {
          other = '-Surface Mail (Premium)';
        }

        // Fill in row
        text_str += `<tr style="background-color:${colorer % 2 == 0 ? '#FFFFFF' : '#EEEEEE'};"><td style="text-align: center; border: 1px solid black;">${c.country_name}</td><td style="text-align: center; border: 1px solid black;">${c.ems_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.dhl_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.airsp_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.airspu_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.airp_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.salspr_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.salspu_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.salp_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${c.sp_available == 1 ? '〇' : ''}</td><td style="text-align: center; border: 1px solid black;">${other}</td></tr>`;
        colorer++;
      });
      text_str += '</tbody></table>';
      // const copyelement = document.createElement("textarea");
      // copyelement.value = text_str;
      // document.body.appendChild(copyelement);
      // copyelement.focus();
      // copyelement.select();
      // document.execCommand("copy");
      // copyelement.parentElement.removeChild(copyelement);

      function listener(e) {
        e.clipboardData.setData('text/html', text_str);
        e.clipboardData.setData('text/plain', text_str);
        e.preventDefault();
      }
      document.addEventListener('copy', listener);
      document.execCommand('copy');
      document.removeEventListener('copy', listener);
    },
    copynomethods: function() {
      this.allShippingMethods.sort((a, b) => {
        if (a.country_name < b.country_name) {
          return -1;
        } else if (a.country_name > b.country_name) {
          return 1;
        } else {
          return 0;
        }
      });
      let output_str = '';
      let noavailable_str = '■下記の国は発送方法がない';
      let dhlonly_str = '■下記の国はDHLのみ';
      this.allShippingMethods.forEach((c) => {
        // Determin if and what other methods that are available
        let has_shipping_methods = false;
        let has_dhl = false;

        // Check special cases
        if (c.country_name == 'UNITED STATES') {
          has_shipping_methods = true;
        } else if (c.country_name == 'CANADA' || c.country_name == 'AUSTRALIA') {
          has_shipping_methods = true;
        } else if (c.country_name == 'RUSSIAN FEDERATION' || c.country_name == 'BRAZIL') {
          has_shipping_methods = true;
        }

        // Check our standard methods
        if (c.ems_available == 1 || c.airsp_available == 1 || c.airspu_available == 1 || c.salspr_available == 1 || c.salspu_available == 1 || c.salp_available == 1 || c.airp_available == 1 || c.sp_available == 1) {
          has_shipping_methods = true;
        }
        if (c.dhl_available == 1) {
          has_dhl = true;
        }

        // Output result
        if (!has_shipping_methods) {
          if (has_dhl) {
            dhlonly_str += `\n${c.country_name}`;
          } else {
            noavailable_str += `\n${c.country_name}`;
          }
        }
      });
      output_str = `${noavailable_str}\n\n${dhlonly_str}`;

      function listener(e) {
        e.clipboardData.setData('text/html', output_str);
        e.clipboardData.setData('text/plain', output_str);
        e.preventDefault();
      }
      document.addEventListener('copy', listener);
      document.execCommand('copy');
      document.removeEventListener('copy', listener);
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
.sticky-top {
  z-index: 1;
  position: sticky;
  top: 0;
}
</style>
