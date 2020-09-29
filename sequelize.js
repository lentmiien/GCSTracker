const Sequelize = require('sequelize');
// Load models
const CountryModel = require('./models/country');
const CountrylistModel = require('./models/countrylist');
const TrackingModel = require('./models/tracking');
const GrouplabelModel = require('./models/grouplabel');

// Connect to DB
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
});

// Attach DB to model
const Country = CountryModel(sequelize, Sequelize);
const Countrylist = CountrylistModel(sequelize, Sequelize);
const Tracking = TrackingModel(sequelize, Sequelize);
const Grouplabel = GrouplabelModel(sequelize, Sequelize);

const Op = Sequelize.Op;

// Create all necessary tables
sequelize.sync().then(() => {
  console.log(`Database & tables syncronized!`);
});

// Export models
module.exports = {
  Country,
  Countrylist,
  Tracking,
  Grouplabel,
  Op,
};
