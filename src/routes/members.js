const router = require("express").Router();

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

router.get("/members", async (request, response) => {
  await response.status(200).json({
    type: "success",
    members: [
      {
        id: 100222333,
        firstName: "TOM",
        lastName: "Smith",
        email: "tsmith@ucmerced.edu",
        year: "freshmen",
        github: "https://github.com/tsmith",
        linkedin: "https://www.linkedin.com/in/tsmith",
        portfolium: null,
        handshake: null,
        slack: "tsmith",
        discord: "Anlisp#9248",
        image: null,
        active: true,
        banned: false,
        createdDate: new Date()
      }
    ]
  });
});

module.exports = router;
