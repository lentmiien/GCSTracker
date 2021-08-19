// Require used packages
var express = require('express');
var router = express.Router();

// Require controller modules
var controller = require('../controllers/apiController');

//-------------------------------------------//
// router.method(path, controller.endpoint); //
//-------------------------------------------//

router.all('*', controller.login_check);

// API routes
// Tracking
router.get('/getall', controller.get_all);
router.post('/add', controller.api_add);
router.post('/addex', controller.api_addex);
router.post('/update', controller.api_update);
router.get('/gettrackingdata', controller.acquire_tracking_data);
router.get('/gettrackingdatabatch', controller.acquire_tracking_data_batch);
router.post('/update_tracking', controller.update_tracking);
// Country list
router.get('/getallcountries', controller.get_all_countries);
router.post('/addcountry', controller.addcountry);
// Shipping methods list
router.get('/getallshippings', controller.get_all_shippings);
router.post('/updateshipping', controller.update_shipping);
// Group label
router.get('/getallgrouplabels', controller.get_all_grouplabels);
router.post('/addgrouplabel', controller.addgrouplabel);
// Other
router.post('/report', controller.api_report);
router.get('/get/:startdate/:enddate', controller.api_get);
router.get('/getcsv', controller.api_csv);
router.get('/getlog', controller.get_log);
router.post('/errorcheck', controller.errorcheck);

router.get('/shipping_country_csv', controller.shipping_country_csv);

router.get('/alerts', controller.alerts);

// Export router
module.exports = router;
