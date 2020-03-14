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

// Show delivered data
router.get('/delivered', controller.delivered);
router.get('/delivered_country', controller.delivered_country);

// Add records
//router.post('/add', controller.add);// Use api instead

// Start tracking
router.get('/track', controller.track);

// Get progress
router.get('/progress', controller.progress);

// Get details
router.get('/details/:id', controller.details);

// Download CSV
router.get('/csv', controller.csv);

// Clear old records (delivered over 14 days ago) and return CSV of deleted records
router.get('/clear', controller.clear);

// Export router
module.exports = router;
