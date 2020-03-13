const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const chalk = require("chalk"); // require chalk module to give colors to console text
const { Pool } = require('pg');
require("dotenv").config();

const routes = require("./src/api/routes");

const app = express();
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
})
const connected = chalk.bold.cyan;
const warning = chalk.bold.yellow;
const termination = chalk.bold.red;

app.use(cors());
app.use(helmet());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(morgan("tiny"));

// All Api routes
app.use("/api", routes.members);

// Handles any requests that don't match the ones above
app.get('*', (request, response) =>{
  response.status(404).send("404 Error: Page Not Found!");
});

// the pool will emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err)
  process.exit(-1)
})

pool.query(`create table if not exists members (
  ID serial primary key not null,
  student_id varchar(15) not null,
  first_name varchar(255) not null,
  last_name varchar(255) not null,
  email varchar(255) not null,
  year varchar(30),
  github varchar(255)
  linkedin varchar(255)
  personal_website varchar(255)
  stackoverflow varchar(255)
  portfolium varchar(255)
  handshake varchar(255)
  slack varchar(50)
  discord varchar(50)
  thumbnail bytea
  active boolean
  banned boolean
  privilege varchar(50)
  created_at TIMESTAMPTZ default NOW()
);`)

app.listen(process.env.PORT || 3000, () =>
  console.log(
    connected(`Example app listening on port ${process.env.PORT || 3000} in ${app.settings.env} mode!`)
  )
);

process.on("warning", error => {
  console.warn(warning(`Express connection has occurred ${error} error!`));
});

process.on("exit", code => {
  console.error(termination(`About to exit with code: ${code}`));
  process.exit(0);
});
