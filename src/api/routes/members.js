const router = require("express").Router();
const jwt = require("jsonwebtoken");

const db = require("src/config/postgres");
const {
  hash,
  jwtSecret,
  jwtExpirationInterval
} = require("src/config/variables");

/**
 * @api {get} /api/members
 * @apiDescription Get members information
 * @apiVersion 1.0.0
 * @apiName Half-Dome
 * @apiGroup Member(s)
 * @apiPermission public
 *
 * @apiSuccess {Object} Returns user information.
 *
 * @apiError  401  Unauthorized            Only authenticated users can access the data
 * @apiError  403  Forbidden               Only admins can access the data
 * @apiError  500  Internal Server Error   Error occurred when processing the SQL query
 */
router.get("/member", (request, response) => {
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.query.email],
    (error, selectResponse) => {
      if (error) {
        response.status(500).send(error);
      }

      response.status(200).send(selectResponse);
    }
  );
});

/**
 * @api {post} /api/login
 * @apiDescription Authenticates a member
 * @apiVersion 1.0.0
 * @apiName Half Dome
 * @apiGroup Member(s)
 * @apiPermission public
 *
 * @apiSuccess {Boolean}  Returns authentication as true or false.
 * @apiSuccess {Object}   Returns token from authentication.
 *
 * @apiError 401   Unauthorized            Only authenticated users can access the data
 * @apiError 403   Forbidden               Only admins can access the data
 * @apiError 500   Internal Server Error   Error occurred when processing the SQL query
 */
router.get("/login", async (request, response) => {
  // decrypt password
  hash.update(request.query.password);
  const hashedPass = hash.digest("hex");
  hash.reset();

  // Check for valid email
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.query.email],
    (error, emailCheck) => {
      if (error) {
        response.status(500).send(error);
      } else if (emailCheck.rowCount == 0) {
        response.status(302).send("Email does not exist");
      } else {
        if (emailCheck.rows[0].password == hashedPass) {
          const token = jwt.sign({ data: emailCheck.rows[0] }, jwtSecret, {
            expiresIn: jwtExpirationInterval // expires in 24 hours
          });
          response.status(200).send({ auth: true, token: token });
        } else {
          response
            .status(302)
            .send({ auth: false, error: "Incorrect Password" });
        }
      }
    }
  );
});

/**
 * @api {post} /api/signup
 * @apiDescription Creates a new member
 * @apiVersion 1.0.0
 * @apiName Half Dome
 * @apiGroup Member(s)
 * @apiPermission public
 *
 * @apiSuccess {String} Returns success message.
 *
 * @apiError 401   Unauthorized            Only authenticated users can access the data
 * @apiError 403   Forbidden               Only admins can access the data
 * @apiError 500   Internal Server Error   Error occurred when processing the SQL query
 */
router.post("/signup", (request, response) => {
  // destructure request body
  const {
    studentId,
    firstName,
    lastName,
    email,
    password,
    year,
    github,
    linkedin,
    personalWebsite,
    stackOverflow,
    portfolium,
    handshake,
    slack,
    discord,
    thumbnail
  } = request.body;

  // Check for valid email
  db.query(
    "select count(email) from members where email = $1",
    [email],
    (error, emailCheck) => {
      if (error) {
        response.status(500);
      } else if (emailCheck.rows[0] > 0) {
        response.status(302).send("Email already exists");
      }
    }
  );

  // Validate student ID
  db.query(
    "select count(student_id) from members where student_id = $1",
    [studentId],
    (error, studentIdCheck) => {
      if (error) {
        response.status(500);
      } else if (studentIdCheck.rows[0] > 0) {
        response.status(302).send("Student ID already exists");
      }
    }
  );

  // hash password
  hash.update(password);
  const hashedPass = hash.digest("hex");
  hash.reset();

  // add user to database
  db.query(
    "insert into members (student_id, first_name, last_name, email, password, year, github, linkedin, personal_website, stack_overflow, portfolium, handshake, slack, discord, thumbnail, active, banned, privilege) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18);",
    [
      studentId,
      firstName,
      lastName,
      email,
      hashedPass,
      year,
      github,
      linkedin,
      personalWebsite,
      stackOverflow,
      portfolium,
      handshake,
      slack,
      discord,
      thumbnail,
      false,
      false,
      "member"
    ],
    (error, insertResponse) => {
      if (insertError) {
        response.status(500).send(error);
      }

      response
        .status(201)
        .send(`Successfully inserted ${studentId}'s information!`);
    }
  );
});

// export our router to be mounted by the parent application
module.exports = router;
