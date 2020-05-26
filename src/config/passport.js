const JwtStrategy = require("passport-jwt").Strategy;
const BearerStrategy = require("passport-http-bearer");
const { ExtractJwt } = require("passport-jwt");

const { jwtSecret } = require("./variables");
const authProviders = require("../api/utils/authProviders");
const { Member } = require("../api/services/member/member.model");

const jwtOptions = {
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme("Bearer"),
};

const jwt = async (payload, done) => {
  try {
    const member = await Member.findById(payload.sub);
    if (member) return done(null, member);
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
};

const oAuth = (service) => async (token, done) => {
  try {
    const userData = await authProviders[service](token);
    const member = await Member.oAuthLogin(userData);
    return done(null, member);
  } catch (err) {
    return done(err);
  }
};

exports.jwt = new JwtStrategy(jwtOptions, jwt);
exports.facebook = new BearerStrategy(oAuth("facebook"));
exports.google = new BearerStrategy(oAuth("google"));
