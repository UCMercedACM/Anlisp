const express = require("express");
const validate = require("express-validation");

const controller = require("./member.controller");
const { authorize, ADMIN, LOGGED_member } = require("../../middlewares/auth");
const {
  listmembers,
  createmember,
  replacemember,
  updatemember
} = require("./member.validation");

const router = express.Router();

/**
 * Load member when API with memberId route parameter is hit
 */
router.param("memberId", controller.load);

router
  .route("/")
  /**
   * @api {get} /members List members
   * @apiDescription Get a list of members
   * @apiVersion 1.0.0
   * @apiName Listmembers
   * @apiGroup member
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiParam  {Number{1-}}         [page=1]     List page
   * @apiParam  {Number{1-100}}      [perPage=1]  members per page
   * @apiParam  {String}             [name]       member's name
   * @apiParam  {String}             [email]      member's email
   * @apiParam  {String=member,admin}  [role]       member's role
   *
   * @apiSuccess {Object[]} members List of members.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated members can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(ADMIN), validate(listmembers), controller.list)
  /**
   * @api {post} /members Create member
   * @apiDescription Create a new member
   * @apiVersion 1.0.0
   * @apiName Createmember
   * @apiGroup member
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiParam  {String}             email     member's email
   * @apiParam  {String{6..128}}     password  member's password
   * @apiParam  {String{..128}}      [name]    member's name
   * @apiParam  {String=member,admin}  [role]    member's role
   *
   * @apiSuccess (Created 201) {String}  id         member's id
   * @apiSuccess (Created 201) {String}  name       member's name
   * @apiSuccess (Created 201) {String}  email      member's email
   * @apiSuccess (Created 201) {String}  role       member's role
   * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated members can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(authorize(ADMIN), validate(createmember), controller.create);

router
  .route("/profile")
  /**
   * @api {get} /members/profile member Profile
   * @apiDescription Get logged in member profile information
   * @apiVersion 1.0.0
   * @apiName memberProfile
   * @apiGroup member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiSuccess {String}  id         member's id
   * @apiSuccess {String}  name       member's name
   * @apiSuccess {String}  email      member's email
   * @apiSuccess {String}  role       member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated members can access the data
   */
  .get(authorize(), controller.loggedIn);

router
  .route("/:memberId")
  /**
   * @api {get} /members/:id Get member
   * @apiDescription Get member information
   * @apiVersion 1.0.0
   * @apiName Getmember
   * @apiGroup member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiSuccess {String}  id         member's id
   * @apiSuccess {String}  name       member's name
   * @apiSuccess {String}  email      member's email
   * @apiSuccess {String}  role       member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401) Unauthorized Only authenticated members can access the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     member does not exist
   */
  .get(authorize(LOGGED_member), controller.get)

  /**
   * @api {put} /members/:id Replace member
   * @apiDescription Replace the whole member document with a new one
   * @apiVersion 1.0.0
   * @apiName Replacemember
   * @apiGroup member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiParam  {String}             email     member's email
   * @apiParam  {String{6..128}}     password  member's password
   * @apiParam  {String{..128}}      [name]    member's name
   * @apiParam  {String=member,admin}  [role]    member's role
   * (You must be an admin to change the member's role)
   *
   * @apiSuccess {String}  id         member's id
   * @apiSuccess {String}  name       member's name
   * @apiSuccess {String}  email      member's email
   * @apiSuccess {String}  role       member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated members can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     member does not exist
   */
  .put(authorize(LOGGED_member), validate(replacemember), controller.replace)

  /**
   * @api {patch} /members/:id Update member
   * @apiDescription Update some fields of a member document
   * @apiVersion 1.0.0
   * @apiName Updatemember
   * @apiGroup member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiParam  {String}             email     member's email
   * @apiParam  {String{6..128}}     password  member's password
   * @apiParam  {String{..128}}      [name]    member's name
   * @apiParam  {String=member,admin}  [role]    member's role
   * (You must be an admin to change the member's role)
   *
   * @apiSuccess {String}  id         member's id
   * @apiSuccess {String}  name       member's name
   * @apiSuccess {String}  email      member's email
   * @apiSuccess {String}  role       member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated members can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     member does not exist
   */
  .patch(authorize(LOGGED_member), validate(updatemember), controller.update)

  /**
   * @api {patch} /members/:id Delete member
   * @apiDescription Delete a member
   * @apiVersion 1.0.0
   * @apiName Deletemember
   * @apiGroup member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  member's access token
   *
   * @apiSuccess (No Content 204)  Successfully deleted
   *
   * @apiError (Unauthorized 401) Unauthorized  Only authenticated members can delete the data
   * @apiError (Forbidden 403)    Forbidden     Only member with same id or admins can delete the data
   * @apiError (Not Found 404)    NotFound      member does not exist
   */
  .delete(authorize(LOGGED_member), controller.remove);

module.exports = router;
