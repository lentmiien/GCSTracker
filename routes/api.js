// Require used packages
var express = require('express');
var router = express.Router();

// Require controller modules
var controller = require('../controllers/apiController');

//-------------------------------------------//
// router.method(path, controller.endpoint); //
//-------------------------------------------//

// API routes
router.post('/add', controller.api_add);
router.post('/report', controller.api_report);
router.get('/getall', controller.get_all);
router.get('/get/:startdate/:enddate', controller.api_get);
router.get('/csv', controller.api_csv);

// Export router
module.exports = router;
