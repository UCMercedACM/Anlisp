const { Sequelize } = require("sequelize");

const { connected, termination } = require("./chalk");
const { pg, env } = require("./variables");

// set Sequelize Promise to Bluebird
Sequelize.Promise = Promise;

/**
 * Connect to postgres DB
 *
 * @returns {object} Postgres connection
 * @public
 */
const sequelize = new Sequelize(pg.connectionString, {
  logging: env === "development" ? (...msg) => console.log(msg) : false,
});

sequelize
  .authenticate()
  .then(() => {
    console.log(connected("Connection has been established successfully.")); // eslint-disable-line no-console
  })
  .catch((err) => {
    console.error(termination(`Unable to connect to the database: ${err}`)); // eslint-disable-line no-console
  });

module.exports = { sequelize };
