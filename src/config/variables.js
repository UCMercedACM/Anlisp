const path = require("path");
const { SHA3 } = require('sha3');

// import .env variables
require("dotenv-safe").config({
  path: path.join(__dirname, "../../.env"),
  sample: path.join(__dirname, "../../.env.example"),
  allowEmptyValues: true
});

module.exports = {
  hash: new SHA3(512),
  env: process.env.NODE_ENV,
  port: process.env.PORT || 3000,
  host: process.env.HOST || "0.0.0.0",
  jwtSecret: process.env.JWT_SECRET,
  jwtExpirationInterval: process.env.JWT_EXPIRATION_MINUTES,
  pg: {
    connectionString:
      process.env.NODE_ENV === "production"
        ? process.env.POSTGRES_URL
        : `postgresql://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DB}`
  },
  logs: process.env.NODE_ENV === "production" ? "combined" : "dev",
  rateLimitTime: process.env.RATE_LIMIT_TIME,
  rateLimitRequest: process.env.RATE_LIMIT_REQUEST
};
