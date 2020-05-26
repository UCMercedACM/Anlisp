const { port, host, env } = require("./config/variables");
const app = require("./config/express");
const { connected, warning, termination } = require("./config/chalk");

// open postgres connection
require("./config/postgres");

// listen to requests
app.listen(port, host, () => {
  console.info(connected(`There we go ♕`));
  console.info(
    connected(`Gladly listening on http://127.0.0.1:${port} in ${env} mode`)
  );
});

process.on("warning", (error) => {
  console.warn(warning(`Express connection has occurred ${error} error!`));
});

process.on("exit", (code) => {
  console.error(termination(`About to exit with code: ${code}`));
  process.exit(0);
});

process.on("unhandledRejection", (error) => {
  // Will print "unhandledRejection error is not defined"
  console.error(termination(`unhandledRejection: ${error.message}`));
});

/**
 * Exports express
 * @public
 */
module.exports = app;
