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
  dialect: "postgres",
  define: {
    // don't forget to enable timestamps!
    timestamps: true,

    // I want createdAt to actually be called created_at
    createdAt: "created_at",

    // I want updatedAt to actually be called updated_at
    updatedAt: "updated_at",

    // And deletedAt to be called destroyed_at (remember to enable paranoid for this to work)
    deletedAt: "destroyTime",

    // don't delete database entries but set the newly added attribute deletedAt
    // to the current date (when deletion was done). paranoid will only work if
    // timestamps are enabled
    paranoid: true,

    // Will automatically set field option for all attributes to snake cased name.
    // Does not override attribute with field option already defined
    underscored: true,

    // disable the modification of table names; By default, sequelize will automatically
    // transform all passed model names (first parameter of define) into plural.
    // if you don't want that, set the following
    freezeTableName: true,

    // Enable optimistic locking.  When enabled, sequelize will add a version count attribute
    // to the model and throw an OptimisticLockingError error when stale instances are saved.
    // Set to true or a string with the attribute name you want to use to enable.
    version: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

const Model = Sequelize.Model;

sequelize
  .authenticate()
  .then(() => {
    console.log(connected("Connection has been established successfully.")); // eslint-disable-line no-console
  })
  .catch((err) => {
    console.error(termination(`Unable to connect to the database: ${err}`)); // eslint-disable-line no-console
  });

module.exports = { sequelize, Model };
