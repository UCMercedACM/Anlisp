const httpStatus = require("http-status");
const passport = require("passport");
const member = require("../services/member/member.model");
const APIError = require("../utils/APIError");

const ADMIN = "admin";
const LOGGED_member = "_loggedmember";

const handleJWT = (req, res, next, roles) => async (err, member, info) => {
  const error = err || info;
  const logIn = Promise.promisify(req.logIn);
  const apiError = new APIError({
    message: error ? error.message : "Unauthorized",
    status: httpStatus.UNAUTHORIZED,
    stack: error ? error.stack : undefined
  });

  try {
    if (error || !member) throw error;
    await logIn(member, { session: false });
  } catch (e) {
    return next(apiError);
  }

  if (roles === LOGGED_member) {
    if (
      member.role !== "admin" &&
      req.params.memberId !== member._id.toString()
    ) {
      apiError.status = httpStatus.FORBIDDEN;
      apiError.message = "Forbidden";
      return next(apiError);
    }
  } else if (!roles.includes(member.role)) {
    apiError.status = httpStatus.FORBIDDEN;
    apiError.message = "Forbidden";
    return next(apiError);
  } else if (err || !member) {
    return next(apiError);
  }

  req.member = member;

  return next();
};

exports.ADMIN = ADMIN;
exports.LOGGED_member = LOGGED_member;

exports.authorize = (roles = member.roles) => (req, res, next) =>
  passport.authenticate(
    "jwt",
    { session: false },
    handleJWT(req, res, next, roles)
  )(req, res, next);

exports.oAuth = service => passport.authenticate(service, { session: false });
