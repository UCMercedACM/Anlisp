const path = require("path");

// import .env variables
require("dotenv-safe").config({
  path: path.join(__dirname, "../../.env"),
  sample: path.join(__dirname, "../../.env.example"),
});

module.exports = {
  env: process.env.NODE_ENV,
  port: process.env.PORT || 4201,
  host: process.env.HOST || "0.0.0.0",
  port: process.env.PORT,
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
  rateLimitRequest: process.env.RATE_LIMIT_REQUEST,
};
