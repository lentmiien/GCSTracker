import Vue from 'vue';
import VueRouter from 'vue-router';
import Home from '../views/Home.vue';
import Undelivered from '../views/Undelivered.vue';
import UndeliveredCountries from '../views/UndeliveredCountries.vue';
import UndeliveredStatus from '../views/UndeliveredStatus.vue';
import Delivered30days from '../views/Delivered30days.vue';
import DeliveredCountries90days from '../views/DeliveredCountries90days.vue';
import TrackingDetails from '../views/TrackingDetails.vue';
import CountryDetails from '../views/CountryDetails.vue';
import Maintenance from '../views/Maintenance.vue';
import RuntimeLog from '../views/RuntimeLog.vue';
import AddRecords from '../views/AddRecords.vue';
import CountryList from '../views/CountryList.vue';

Vue.use(VueRouter);

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/undelivered',
    name: 'Undelivered',
    component: Undelivered,
  },
  {
    path: '/undeliveredcountries',
    name: 'UndeliveredCountries',
    component: UndeliveredCountries,
  },
  {
    path: '/undeliveredstatus',
    name: 'UndeliveredStatus',
    component: UndeliveredStatus,
  },
  {
    path: '/delivered30',
    name: 'Delivered30days',
    component: Delivered30days,
  },
  {
    path: '/deliveredcountries90',
    name: 'DeliveredCountries90days',
    component: DeliveredCountries90days,
  },
  {
    path: '/trackingdetails',
    name: 'TrackingDetails',
    component: TrackingDetails,
  },
  {
    path: '/countrydetails',
    name: 'CountryDetails',
    component: CountryDetails,
  },
  {
    path: '/maintenance',
    name: 'Maintenance',
    component: Maintenance,
  },
  {
    path: '/runtimelog',
    name: 'RuntimeLog',
    component: RuntimeLog,
  },
  {
    path: '/addrecords',
    name: 'AddRecords',
    component: AddRecords,
  },
  {
    path: '/countrylist',
    name: 'CountryList',
    component: CountryList,
  },
  {
    path: '/about',
    name: 'About',
    // route level code-splitting
    // this generates a separate chunk (about.[hash].js) for this route
    // which is lazy-loaded when the route is visited.
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue'),
  },
];

const router = new VueRouter({
  routes,
});

export default router;
