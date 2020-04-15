module.exports = (sequelize, type) => {
  return sequelize.define('tracking', {
    tracking: type.STRING,
    carrier: type.STRING,
    country: type.STRING,
    tracking_country: type.STRING,
    addeddate: type.BIGINT,
    lastchecked: type.BIGINT,
    status: type.STRING,
    shippeddate: type.BIGINT,
    delivereddate: type.BIGINT,
    delivered: type.BOOLEAN,
    data: type.TEXT,
  });
};
