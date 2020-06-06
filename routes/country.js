// Require used packages
var express = require('express');
var router = express.Router();

// Require controller modules
var controller = require('../controllers/countryController');

//-------------------------------------------//
// router.method(path, controller.endpoint); //
//-------------------------------------------//

router.get('/', controller.rank);

router.get('/update', controller.update_page);
router.post('/update', controller.update_value);
router.get('/bulk_update', controller.bulkupdate);
router.post('/bulk_update', controller.bulkupdate);

router.get('/recalculate', controller.recalculate);

router.post('/addcl', controller.addcl);

// Export router
module.exports = router;
