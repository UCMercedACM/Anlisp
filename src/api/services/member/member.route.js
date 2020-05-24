const express = require("express");
const validator = require("express-joi-validation").createValidator({});

const controller = require("./member.controller");
const { authorize, ADMIN, LOGGED_USER } = require("../../middlewares/auth");
const {
  listUsers,
  createUser,
  replaceUser,
  updateUser,
} = require("./member.validation");

const router = express.Router();

/**
 * Load member when API with userId route parameter is hit
 */
router.param("userId", controller.load);

router
  .route("/")
  /**
   * @api {get} v1/users List Users
   * @apiDescription Get a list of users
   * @apiVersion 1.0.0
   * @apiName ListUsers
   * @apiGroup Member
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiParam  {Number{1-}}         [page=1]     List page
   * @apiParam  {Number{1-100}}      [perPage=1]  Users per page
   * @apiParam  {String}             [name]       Member's name
   * @apiParam  {String}             [email]      Member's email
   * @apiParam  {String=member,admin}  [role]       Member's role
   *
   * @apiSuccess {Object[]} users List of users.
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
   * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
   */
  .get(authorize(ADMIN), validator.query(listUsers.query), controller.list)
  /**
   * @api {post} v1/users Create Member
   * @apiDescription Create a new member
   * @apiVersion 1.0.0
   * @apiName CreateUser
   * @apiGroup Member
   * @apiPermission admin
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiParam  {String}             email     Member's email
   * @apiParam  {String{6..128}}     password  Member's password
   * @apiParam  {String{..128}}      [name]    Member's name
   * @apiParam  {String=member,admin}  [role]    Member's role
   *
   * @apiSuccess (Created 201) {String}  id         Member's id
   * @apiSuccess (Created 201) {String}  name       Member's name
   * @apiSuccess (Created 201) {String}  email      Member's email
   * @apiSuccess (Created 201) {String}  role       Member's role
   * @apiSuccess (Created 201) {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)   ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401)  Unauthorized     Only authenticated users can create the data
   * @apiError (Forbidden 403)     Forbidden        Only admins can create the data
   */
  .post(authorize(ADMIN), validator.body(createUser.body), controller.create);

router
  .route("/profile")
  /**
   * @api {get} v1/users/profile Member Profile
   * @apiDescription Get logged in member profile information
   * @apiVersion 1.0.0
   * @apiName UserProfile
   * @apiGroup Member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiSuccess {String}  id         Member's id
   * @apiSuccess {String}  name       Member's name
   * @apiSuccess {String}  email      Member's email
   * @apiSuccess {String}  role       Member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401)  Unauthorized  Only authenticated Users can access the data
   */
  .get(authorize(), controller.loggedIn);

router
  .route("/:userId")
  /**
   * @api {get} v1/users/:id Get Member
   * @apiDescription Get member information
   * @apiVersion 1.0.0
   * @apiName GetUser
   * @apiGroup Member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiSuccess {String}  id         Member's id
   * @apiSuccess {String}  name       Member's name
   * @apiSuccess {String}  email      Member's email
   * @apiSuccess {String}  role       Member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can access the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can access the data
   * @apiError (Not Found 404)    NotFound     Member does not exist
   */
  .get(authorize(LOGGED_USER), controller.get)
  /**
   * @api {put} v1/users/:id Replace Member
   * @apiDescription Replace the whole member document with a new one
   * @apiVersion 1.0.0
   * @apiName ReplaceUser
   * @apiGroup Member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiParam  {String}             email     Member's email
   * @apiParam  {String{6..128}}     password  Member's password
   * @apiParam  {String{..128}}      [name]    Member's name
   * @apiParam  {String=member,admin}  [role]    Member's role
   * (You must be an admin to change the member's role)
   *
   * @apiSuccess {String}  id         Member's id
   * @apiSuccess {String}  name       Member's name
   * @apiSuccess {String}  email      Member's email
   * @apiSuccess {String}  role       Member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     Member does not exist
   */
  .put(
    authorize(LOGGED_USER),
    validator.body(replaceUser.body),
    validator.params(replaceUser.params),
    controller.replace
  )
  /**
   * @api {patch} v1/users/:id Update Member
   * @apiDescription Update some fields of a member document
   * @apiVersion 1.0.0
   * @apiName UpdateUser
   * @apiGroup Member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiParam  {String}             email     Member's email
   * @apiParam  {String{6..128}}     password  Member's password
   * @apiParam  {String{..128}}      [name]    Member's name
   * @apiParam  {String=member,admin}  [role]    Member's role
   * (You must be an admin to change the member's role)
   *
   * @apiSuccess {String}  id         Member's id
   * @apiSuccess {String}  name       Member's name
   * @apiSuccess {String}  email      Member's email
   * @apiSuccess {String}  role       Member's role
   * @apiSuccess {Date}    createdAt  Timestamp
   *
   * @apiError (Bad Request 400)  ValidationError  Some parameters may contain invalid values
   * @apiError (Unauthorized 401) Unauthorized Only authenticated users can modify the data
   * @apiError (Forbidden 403)    Forbidden    Only member with same id or admins can modify the data
   * @apiError (Not Found 404)    NotFound     Member does not exist
   */
  .patch(
    authorize(LOGGED_USER),
    validator.body(updateUser.body),
    validator.params(updateUser.params),
    controller.update
  )
  /**
   * @api {patch} v1/users/:id Delete Member
   * @apiDescription Delete a member
   * @apiVersion 1.0.0
   * @apiName DeleteUser
   * @apiGroup Member
   * @apiPermission member
   *
   * @apiHeader {String} Authorization  Member's access token
   *
   * @apiSuccess (No Content 204)  Successfully deleted
   *
   * @apiError (Unauthorized 401) Unauthorized  Only authenticated users can delete the data
   * @apiError (Forbidden 403)    Forbidden     Only member with same id or admins can delete the data
   * @apiError (Not Found 404)    NotFound      Member does not exist
   */
  .delete(authorize(LOGGED_USER), controller.remove);

module.exports = router;
