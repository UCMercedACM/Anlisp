// make bluebird default Promise
Promise = require("bluebird"); // eslint-disable-line no-global-assign

const { port, host, env } = require("./config/vars");
const app = require("./config/express");
const chalk = require("./config/chalk");
const postgres = require("./config/pg");

// open postgres connection
postgres.connect();

// listen to requests
app.listen(port, host, () =>
  console.info(
    chalk.connected(`Example app listening on port ${port} in ${env} mode!`)
  )
);

process.on("warning", (error) => {
  console.warn(
    chalk.warning(`Express connection has occurred ${error} error!`)
  );
});

process.on("exit", (code) => {
  console.error(chalk.termination(`About to exit with code: ${code}`));
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection error is not defined"
  console.error(chalk.termination(`unhandledRejection: ${error.message}`));
});

/**
 * Exports express
 * @public
 */
module.exports = app;
