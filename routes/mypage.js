// Require used packages
var express = require('express');
var router = express.Router();

// Require controller modules
var controller = require('../controllers/mypageController');

//-------------------------------------------//
// router.method(path, controller.endpoint); //
//-------------------------------------------//

// Dashboard
router.get('/', controller.mypage);
router.get('/status', controller.status_check);

// Show analysis data
router.get('/undelivered', controller.undelivered);
router.get('/undelivered/:carrier/:start/:end', controller.undelivered);
router.get('/undelivered_country', controller.undelivered_country);
router.get('/ucountry/:country', controller.ucountry);
router.get('/delivered', controller.delivered);
router.get('/delivered_country', controller.delivered_country);
router.get('/country/:country', controller.country);
router.get('/countrytrend/:country', controller.countrytrend);
router.get('/invalid', controller.invalid);
router.get('/process_invalid/:id', controller.process_invalid);
router.get('/process_valid/:id/:carrier', controller.process_valid);

// Add records
//router.post('/add', controller.add);// Use api instead

// Start tracking
router.get('/track', controller.track);
router.get('/forcetracking', controller.forcetracking);

// Get progress
router.get('/progress', controller.progress);

// Get details
router.get('/details/:id', controller.details);

// Download CSV
router.get('/csv', controller.csv);

// Clear old records (delivered over 14 days ago) and return CSV of deleted records
router.get('/clear', controller.clear);

// Handle old records
router.get('/old_list', controller.list_old);
router.post('/old_set_status/:id/:request', controller.old_set_status);

// Report Lost/Delivered/Returned
router.get('/report', controller.report);

// Runtime logger
router.get('/log', controller.log);

// Data maintenance
router.get('/maintenance', controller.maintenance);
router.post('/update', controller.update);

// Search reporting
router.get('/sreporting', controller.search_reporting);
router.post('/sreporting', controller.search_reporting_result);
router.post('/csreporting', controller.search_reporting_result_cat);

// Export router
module.exports = router;
