const router = require("express").Router();
const db = require("../../config/postgres");
const jwt = require('jsonwebtoken');
var { SHA3 } = require('sha3');
var hash = new SHA3(512);

//   db.query(`create table if not exists members (
//     ID serial primary key not null,
//     student_id varchar(15) not null,
//     first_name varchar(255) not null,
//     last_name varchar(255) not null,
//     email varchar(255) not null,
//     password varchar(255) not null,
//     year varchar(30),
//     github varchar(255),
//     linkedin varchar(255),
//     personal_website varchar(255),
//     stackoverflow varchar(255),
//     portfolium varchar(255),
//     handshake varchar(255),
//     slack varchar(50),
//     discord varchar(50),
//     thumbnail varchar(50),
//     active boolean,
//     banned boolean,
//     privilege varchar(50),
//     created_at TIMESTAMPTZ default NOW()


/**
 * @api {get} /api/members Get Members
 * @apiDescription Returns all Members
 * @apiVersion 1.0.0
 * @apiName Verify Member(s)
 * @apiGroup Member(s)
 * @apiPermission public
 *
 * @apiSuccess {Object[]} Returns user information.
 *
 * @apiError (Unauthorized 401)  Unauthorized  Only authenticated users can access the data
 * @apiError (Forbidden 403)     Forbidden     Only admins can access the data
 */
router.get("/member", async (request, response) => {
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.query.email],
    (error, res) => {
      if (error) {
        response.status(404);
      }

      response.status(200).send(res.rows[0]);
    }
  );
});

router.get("/login", async (request, response) => {
  var email = request.body.email;
  hash.update(request.body.password);
  hash.digest('hex');
  var hashedPass = hash.digest();

  // MAKE SURE TO: Check for valid email
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.body.email],
    (error, emailCheck) => {
      if (error) {
        response.status(500);
      }
      else if (emailCheck.rowCount == 0){
        response.status(200).send("Email does not exist");
      }
      else {
        if (emailCheck.fields[7] == hashedPass) {
          response.status(200).send(emailCheck);
        }
        else {
          response.status(200).send("Incorrect Password");
        }
      }
    });
});

router.post("/signup", async (request, response) => {
  // MAKE SURE TO: Check for valid email
  db.query(
    "SELECT COUNT(email) FROM MEMBERS WHERE email = $1",
    [request.body.email],
    (error, emailCheck) => {
      if (error) {
        response.status(500);
      }
      else if (emailCheck.rows[0] > 0){
        response.status(200).send("Email already exists");
      }
    });

  //VALIDATE STUDENT ID
  db.query(
    "SELECT COUNT(student_id) FROM MEMBERS WHERE student_id = $1",
    [request.body.student_id],
    (error, stuidCheck) => {
      if (error) {
        response.status(500);
      }
      else if (stuidCheck.rows[0] > 0){
        response.status(200).send("Student ID already exists");
      }
    });

  hash.update(request.body.password);
  var hashedPass = hash.digest('hex');
  

  db.query(
    "insert into members (student_id, first_name, last_name, email, password, year, github, linkedin, personal_website, stack_overflow, portfolium, handshake, slack, discord, thumbnail, active, banned, privilege) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18) returning first_name;",
    [
      request.body.studentId,
      request.body.firstName,
      request.body.lastName,
      request.body.email,
      hashedPass,
      request.body.year,
      request.body.github,
      request.body.linkedin,
      request.body.personalWebsite,
      request.body.stackOverflow,
      request.body.portfolium,
      request.body.handshake,
      request.body.slack,
      request.body.discord,
      request.body.thumbnail,
      request.body.active,
      request.body.banned,
      "member"
    ],
    (insertError, insertResponse) => {
      if (insertError) {
        response.status(404);
      }

      console.log(insertResponse);

      response
        .status(200)
        .send(`Successfully inserted ${request.body.studentId}'s information!`);
    }
  );

});

// export our router to be mounted by the parent application
module.exports = router;
