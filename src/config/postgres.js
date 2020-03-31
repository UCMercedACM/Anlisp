const { Pool } = require("pg");
const { pg } = require("./variables");

const pool = new Pool({
  connectionString: pg.connectionString,
  application_name: 'Half Dome',
  fallback_application_name: 'Members API Service',

  // maximum number of clients the pool should contain
  // by default this is set to 10.
  max: 20,

  // number of milliseconds a client must sit idle in the pool and not be checked out
  // before it is disconnected from the backend and discarded
  // default is 10000 (10 seconds) - set to 0 to disable auto-disconnection of idle clients
  idleTimeoutMillis: 30000,

  // number of milliseconds to wait before timing out when connecting a new client
  // by default this is 0 which means no timeout
  connectionTimeoutMillis: 2000,
});

const pgPoolWrapper = {
  async connect() {
      for (let nRetry = 1; ; nRetry++) {
          try {
              const client = await pgPool.connect();
              if (nRetry > 1) {
                  console.info('Now successfully connected to Postgres');
              }
              return client;
          } catch (e) {
              if (e.toString().includes('ECONNREFUSED') && nRetry < 5) {
                  console.info('ECONNREFUSED connecting to Postgres, ' +
                      'maybe container is not ready yet, will retry ' + nRetry);
                  // Wait 1 second
                  await new Promise(resolve => setTimeout(resolve, 1000));
              } else {
                  throw e;
              }
          }
      }
  }
};

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on("error", (error, client) => {
  console.error("Unexpected error on idle client", error);
  process.exit(-1);
});

/**
 * Connect to postgres db
 *
 * @returns {query} Postgres query
 * @returns {getClient} Client for multiple transactions
 * @public
 */
module.exports = {
  query: (text, params, callback) => {
    const start = Date.now();
    return pool.query(text, params, (error, response) => {
      const duration = Date.now() - start;
      console.log(pool.totalCount);
      console.log("executed query", { text, duration, response, rows: response ? response.rowCount : null, error });
      callback(error, response);
    });
  },
  getClient: callback => {
    pool.connect((error, client, done) => {
      const query = client.query;
      // monkey patch the query method to keep track of the last query executed
      client.query = (...args) => {
        client.lastQuery = args;
        return query.apply(client, args);
      };

      // set a timeout of 5 seconds, after which we will log this client's last query
      const timeout = setTimeout(() => {
        console.error("A client has been checked out for more than 5 seconds!");
        console.error(
          `The last executed query on this client was: ${client.lastQuery}`
        );
      }, 5000);

      const release = error => {
        // call the actual 'done' method, returning this client to the pool
        done(error);
        // clear our timeout
        clearTimeout(timeout);
        // set the query method back to its old un-monkey-patched version
        client.query = query;
      };

      callback(error, client, release);
    });
  }
};
