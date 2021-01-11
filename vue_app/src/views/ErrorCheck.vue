<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <h1>Input search</h1>
        <p>*csv file</p>
        <input type="file" id="file" ref="file" v-on:change="handleFileUpload()"/>
        <button v-on:click="submitFile()">Submit</button>
      </div>
    </div>
    <div class="row">
      <div class="col">
        <pre id="output"></pre>
      </div>
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  name: 'ErrorCheck',
  data() {
    return {
      file: '',
    };
  },
  methods: {
    handleFileUpload() {
      this.file = this.$refs.file.files[0];
    },
    submitFile() {
      let formData = new FormData();
      formData.append('file', this.file);

      axios.post( '/api/errorcheck',
        formData,
        {
          headers: {
              'Content-Type': 'multipart/form-data'
          }
        }
      ).then(data => {
        document.getElementById('output').innerHTML = JSON.stringify(data.data, null, 2);
      })
      .catch(function(){
        console.log('FAILURE!!');
      });
    },
  },
};
</script>

<style scoped></style>
