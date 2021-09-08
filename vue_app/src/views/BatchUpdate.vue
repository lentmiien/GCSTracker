<template>
  <div class="container-fluid">
    <div class="row">
      <div class="col">
        <form action="/api/batchupdate" method="post" enctype="multipart/form-data">
          <input type="file" name="updatefile" id="updatefile">
          <input type="submit" value="Submit">
        </form>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "BatchUpdate",
  data() {},
};
</script>

<style scoped></style>
