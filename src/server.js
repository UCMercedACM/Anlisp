Promise = require("bluebird");
import { app } from "./config";

// Listen to requests
app.listen(port, () =>
  console.log(
    connected(
      `Example app listening on port ${port} in ${app.settings.env} mode!`
    )
  )
);

process.on("warning", error => {
  console.warn(warning(`Express connection has occurred ${error} error!`));
});

process.on("exit", code => {
  console.error(termination(`About to exit with code: ${code}`));
  process.exit(0);
});

/**
 * Exports Express
 * @public
 */
module.exports = app;
