import express from "express";
import morgan from "morgan";
import bodyParser from "body-parser";
import compress from "compression";
import methodOverride from "method-override";
import helmet from "helmet";
import cors from "cors";
import passport from "passport";

import { routes, error, rateLimiter } from "../api";
import { logs } from "./variables";
// import { strategies } from "./passport";

/**
 * Express Instance
 * @public
 */
const app = express();

// request logging. dev: console | production: file
app.use(morgan(logs));

// parse body params and attach them to request.body
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// gzip compression
app.use(compress());

// allows the use of HTTP words such as PUT or DELETE in places where the client does not support it
app.use(methodOverride());

// secure apps by setting various HTTP headers
app.use(helmet());

// enable CORS - Cross Origin Resource Sharing
app.use(cors());

// enable authentication
app.use(passport.initialize());
// passport.use('jwt', strategies.jwt);
// passport.use('facebook', strategies.facebook);
// passport.use('google', strategies.google);

// mount docs route to express static
app.use("/docs", express.static("docs"));

// enable rate limit
app.use(rateLimiter());

// mount api routes
app.use("/api", routes);

// if error is not an instanceOf APIError, convert it
app.use(error.converter);

// catch 404 and forward to error handler
app.use(error.notFound);

// error handler, send stacktrace only during development
app.use(error.handler);

module.exports = app;
