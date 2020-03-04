// Require used packages

//---------------------------------------------//
// exports.endpoints = (req, res, next) => {}; //
//---------------------------------------------//

exports.checkall = (req, res, next) => {
  res.locals.role = req.user != undefined ? req.user.role : 'guest';
  next();
};

exports.index = (req, res) => {
  res.render('index');
};
