import { Pool } from "pg";
import { pg } from "./variables";

const pool = new Pool({
  connectionString: pg.connectionString
});

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

// Setup Members table if one has not been created yet
pool.connect().then(client => {
  return client
    .query(
      `CREATE TABLE IF NOT EXISTS MEMBERS (
        ID serial PRIMARY KEY NOT NULL,
        student_id varchar(15) NOT NULL,
        first_name varchar(255) NOT NULL,
        last_name varchar(255) NOT NULL,
        email varchar(255) NOT NULL,
        year varchar(255),
        github varchar(255),
        linkedin varchar(255),
        portfolium varchar(255),
        handshake varchar(255),
        slack varchar(255),
        discord varchar(255),
        image varchar(255),
        active BOOLEAN NOT NULL,
        banned BOOLEAN NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );`,
      [1]
    )
    .then(res => {
      client.release();
      console.log(res.rows[0]);
    })
    .catch(err => {
      client.release();
      console.log(err.stack);
    });
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
    return pool.query(text, params, (err, res) => {
      const duration = Date.now() - start;
      console.log("executed query", { text, duration, rows: res.rowCount });
      callback(err, res);
    });
  },
  getClient: callback => {
    pool.connect((err, client, done) => {
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

      const release = err => {
        // call the actual 'done' method, returning this client to the pool
        done(err);
        // clear our timeout
        clearTimeout(timeout);
        // set the query method back to its old un-monkey-patched version
        client.query = query;
      };

      callback(err, client, release);
    });
  }
};
