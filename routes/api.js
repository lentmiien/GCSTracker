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
// Country list
router.get('/getallcountries', controller.get_all_countries);
router.post('/addcountry', controller.addcountry);
// Shipping methods list
router.get('/getallshippings', controller.get_all_shippings);
router.post('/updateshipping', controller.update_shipping);
// Other
router.post('/report', controller.api_report);
router.get('/get/:startdate/:enddate', controller.api_get);
router.get('/csv', controller.api_csv);

// Export router
module.exports = router;
