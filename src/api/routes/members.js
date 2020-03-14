const router = require("express").Router();
const { query } = require("../../config/postgres");

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
router.get("/member/:email", async (request, response) => {
  db.query(
    "SELECT * FROM MEMBERS WHERE email = $1",
    [request.params.email],
    (error, response) => {
      if (error) {
        response.status(404).send(error);
      }

      response.status(200).send(response.rows[0]);
    }
  );
});

router.post("/member", (request, response) => {
  query(
    "INSERT INTO MEMBERS (student_id, first_name, last_name, email, year, github, linkedin, personal_website, stack_overflow, portfolium, handshake, slack, discord, thumbnail, active, banned, privilege) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)",
    [
      request.body.studentId,
      request.body.firstName,
      request.body.lastName,
      request.body.email,
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
    (error, response) => {
      if (error) {
        response.status(404).send(error);
      }

      response.status(200).send("Successfully inserted slides!");
    }
  );
});

module.exports = router;
