<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
      <router-link to="/" class="navbar-brand">Tracking tool</router-link>
      <button
        class="navbar-toggler"
        type="button"
        data-toggle="collapse"
        data-target="#navbarSupportedContent"
        aria-controls="navbarSupportedContent"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="collapse navbar-collapse" id="navbarSupportedContent">
        <ul class="navbar-nav mr-auto">
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown1"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              >Undelivered</a
            >
            <div class="dropdown-menu" aria-labelledby="navbarDropdown1">
              <router-link to="/undelivered" class="dropdown-item">All</router-link>
              <router-link to="/undeliveredcountries" class="dropdown-item">Country</router-link>
              <router-link to="/undeliveredstatus" class="dropdown-item">Status</router-link>
            </div>
          </li>
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown2"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              >Delivered</a
            >
            <div class="dropdown-menu" aria-labelledby="navbarDropdown2">
              <router-link to="/delivered30" class="dropdown-item">Last 30 days</router-link>
              <router-link to="/deliveredcountries90" class="dropdown-item">Country (90 days)</router-link>
            </div>
          </li>
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown4"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              >Manage</a
            >
            <div class="dropdown-menu" aria-labelledby="navbarDropdown4">
              <router-link to="/countrylist" class="dropdown-item">Country list</router-link>
              <router-link to="/shippinglist" class="dropdown-item">Shipping method list</router-link>
              <router-link to="/shippingratinglist" class="dropdown-item">Shipping rating list</router-link>
              <router-link to="/labels" class="dropdown-item">Group labels</router-link>
            </div>
          </li>
          <li class="nav-item dropdown">
            <a
              class="nav-link dropdown-toggle"
              href="#"
              id="navbarDropdown3"
              role="button"
              data-toggle="dropdown"
              aria-haspopup="true"
              aria-expanded="false"
              >Tools</a
            >
            <div class="dropdown-menu" aria-labelledby="navbarDropdown3">
              <router-link to="/addrecords" class="dropdown-item">Add records</router-link>
              <router-link to="/updaterecords" class="dropdown-item">Update records</router-link>
              <router-link to="/runtimelog" class="dropdown-item">Runtime log</router-link>
              <router-link to="/maintenance" class="dropdown-item">Maintenance</router-link>
              <router-link to="/analyze" class="dropdown-item">Analyze</router-link>
              <router-link to="/alert" class="dropdown-item">Alert</router-link>
            </div>
          </li>
        </ul>
      </div>
    </nav>
  </div>
</template>

<script>
export default {
  name: 'Header',
};
</script>

<style scoped></style>
