const { Sequelize } = require("sequelize");

const { pg, env } = require("./vars");

// set Sequelize Promise to Bluebird
Sequelize.Promise = Promise;

/**
 * Connect to mongo db
 *
 * @returns {object} Mongoose connection
 * @public
 */
exports.connect = () => {
  const sequelize = new Sequelize(pg.connectionString, {
    logging: env === "development" ? (...msg) => console.log(msg) : false,
  });

  // // Exit application on error
  // try {
  //   await sequelize.authenticate();
  //   console.log('Connection has been established successfully.');
  // } catch (error) {
  //   console.error('Unable to connect to the database:', error);
  //   process.exit(-1);
  // }

  return sequelize;
};
