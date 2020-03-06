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
router.get('/get/:startdate/:enddate', controller.api_get);

// Export router
module.exports = router;
