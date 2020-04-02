const express = require("express");
const validate = require("express-validation");
const controller = require("./auth.controller");
const oAuthLogin = require("../../middlewares/auth").oAuth;
const { login, register, oAuth, refresh } = require("./auth.validation");

const router = express.Router();

/**
 * @api {post} v1/auth/register Register
 * @apiDescription Register a new member
 * @apiVersion 1.0.0
 * @apiName Register
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}          email     member's email
 * @apiParam  {String{6..128}}  password  member's password
 *
 * @apiSuccess (Created 201) {String}  token.tokenType     Access Token's type
 * @apiSuccess (Created 201) {String}  token.accessToken   Authorization Token
 * @apiSuccess (Created 201) {String}  token.refreshToken  Token to get a new accessToken
 *                                                   after expiration time
 * @apiSuccess (Created 201) {Number}  token.expiresIn     Access Token's expiration time
 *                                                   in miliseconds
 * @apiSuccess (Created 201) {String}  token.timezone      The server's Timezone
 *
 * @apiSuccess (Created 201) {String}  member.id         member's id
 * @apiSuccess (Created 201) {String}  member.name       member's name
 * @apiSuccess (Created 201) {String}  member.email      member's email
 * @apiSuccess (Created 201) {String}  member.role       member's role
 * @apiSuccess (Created 201) {Date}    member.createdAt  Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 */
router.route("/register").post(validate(register), controller.register);

/**
 * @api {post} v1/auth/login Login
 * @apiDescription Get an accessToken
 * @apiVersion 1.0.0
 * @apiName Login
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}         email     member's email
 * @apiParam  {String{..128}}  password  member's password
 *
 * @apiSuccess  {String}  token.tokenType     Access Token's type
 * @apiSuccess  {String}  token.accessToken   Authorization Token
 * @apiSuccess  {String}  token.refreshToken  Token to get a new accessToken
 *                                                   after expiration time
 * @apiSuccess  {Number}  token.expiresIn     Access Token's expiration time
 *                                                   in miliseconds
 *
 * @apiSuccess  {String}  member.id             member's id
 * @apiSuccess  {String}  member.name           member's name
 * @apiSuccess  {String}  member.email          member's email
 * @apiSuccess  {String}  member.role           member's role
 * @apiSuccess  {Date}    member.createdAt      Timestamp
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or password
 */
router.route("/login").post(validate(login), controller.login);

/**
 * @api {post} v1/auth/refresh-token Refresh Token
 * @apiDescription Refresh expired accessToken
 * @apiVersion 1.0.0
 * @apiName RefreshToken
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  email         member's email
 * @apiParam  {String}  refreshToken  Refresh token aquired when member logged in
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized     Incorrect email or refreshToken
 */
router.route("/refresh-token").post(validate(refresh), controller.refresh);

/**
 * TODO: POST /v1/auth/reset-password
 */

/**
 * @api {post} v1/auth/facebook Facebook Login
 * @apiDescription Login with facebook. Creates a new member if it does not exist
 * @apiVersion 1.0.0
 * @apiName FacebookLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Facebook's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router
  .route("/facebook")
  .post(validate(oAuth), oAuthLogin("facebook"), controller.oAuth);

/**
 * @api {post} v1/auth/google Google Login
 * @apiDescription Login with google. Creates a new member if it does not exist
 * @apiVersion 1.0.0
 * @apiName GoogleLogin
 * @apiGroup Auth
 * @apiPermission public
 *
 * @apiParam  {String}  access_token  Google's access_token
 *
 * @apiSuccess {String}  tokenType     Access Token's type
 * @apiSuccess {String}  accessToken   Authorization Token
 * @apiSuccess {String}  refreshToken  Token to get a new accpessToken after expiration time
 * @apiSuccess {Number}  expiresIn     Access Token's expiration time in miliseconds
 *
 * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
 * @apiError (Unauthorized 401)  Unauthorized    Incorrect access_token
 */
router
  .route("/google")
  .post(validate(oAuth), oAuthLogin("google"), controller.oAuth);

module.exports = router;
