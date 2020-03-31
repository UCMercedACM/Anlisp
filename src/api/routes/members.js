const router = require("express").Router();
const db = require("../../config/postgres");
const jwt = require("jsonwebtoken");
const hash = require("../../config/variables").hash;

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
router.get("/member", (request, response) => {
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.query.email],
    (selectError, selectResponse) => {
      if (selectError) {
        response.status(404);
      }

      response.status(200).send(selectResponse);
    }
  );
});

router.post("/login", async (request, response) => {
  console.log(request.body);
  var email = request.body.email;
  hash.update(request.body.password);
  var hashedPass = hash.digest("hex");
  hash.reset();

  // MAKE SURE TO: Check for valid email
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.body.email],
    (error, emailCheck) => {
      if (error) {
        response.status(500);
      } else if (emailCheck.rowCount == 0) {
        response.status(200).send("Email does not exist");
      } else {
        if (emailCheck.rows[0].password == hashedPass) {
          var token = jwt.sign(
            { data: emailCheck.rows[0] },
            "longpasswordfor31231435315checkingn92i43290stuff",
            {
              expiresIn: 86400 // expires in 24 hours
            }
          );
          response.status(200).send({ auth: true, token: token });
        } else {
          response
            .status(200)
            .send({ auth: false, error: "Incorrect Password" });
        }
      }
    }
  );
});

router.post("/signup", async (request, response) => {
  // MAKE SURE TO: Check for valid email
  db.query(
    "SELECT COUNT(email) FROM MEMBERS WHERE email = $1",
    [request.body.email],
    (error, emailCheck) => {
      if (error) {
        response.status(500);
      } else if (emailCheck.rows[0] > 0) {
        response.status(200).send("Email already exists");
      }
    }
  );

  //VALIDATE STUDENT ID
  db.query(
    "SELECT COUNT(student_id) FROM MEMBERS WHERE student_id = $1",
    [request.body.student_id],
    (error, stuidCheck) => {
      if (error) {
        response.status(500);
      } else if (stuidCheck.rows[0] > 0) {
        response.status(200).send("Student ID already exists");
      }
    }
  );

  hash.update(request.body.password);
  var hashedPass = hash.digest("hex");
  hash.reset();

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
