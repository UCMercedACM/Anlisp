const { Pool } = require("pg");
const { pg } = require("./variables");

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
      `create table if not exists members (
        ID serial primary key not null,
        student_id varchar(15) not null,
        first_name varchar(255) not null,
        last_name varchar(255) not null,
        email varchar(255) not null,
        year varchar(30),
        github varchar(255),
        linkedin varchar(255),
        personal_website varchar(255),
        stackoverflow varchar(255),
        portfolium varchar(255),
        handshake varchar(255),
        slack varchar(50),
        discord varchar(50),
        thumbnail varchar(50),
        active boolean,
        banned boolean,
        privilege varchar(50),
        created_at TIMESTAMPTZ default NOW()
      );`
    )
    .then(res => {
      client.release();
      console.log(`Members table exists!`);
    })
    .catch(err => {
      client.release();
      console.log(`Error: ${err.stack}`);
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
