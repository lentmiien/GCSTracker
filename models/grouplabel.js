module.exports = (sequelize, type) => {
  return sequelize.define('grouplabel', {
    label: type.STRING,
  });
};
