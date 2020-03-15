const Sequelize = require('sequelize');
// Load models
const TrackingModel = require('./models/tracking');

// Connect to DB
const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql'
});

// Attach DB to model
const Tracking = TrackingModel(sequelize, Sequelize);

const Op = Sequelize.Op;

// Create all necessary tables
sequelize.sync().then(() => {
  console.log(`Database & tables syncronized!`);
});

// Export models
module.exports = {
  Tracking,
  Op
};
