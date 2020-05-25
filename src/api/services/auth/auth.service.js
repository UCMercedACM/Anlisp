const moment = require("moment-timezone");

const { Member } = require("../member/member.model");
const RefreshToken = require("./refreshToken.model");
const { jwtExpirationInterval } = require("../../../config/variables");

/**
 * Returns a formated object with tokens
 * @private
 */
function generateTokenResponse(member, accessToken) {
  const tokenType = "Bearer";
  const refreshToken = RefreshToken.generate(member).token;
  const expiresIn = moment().add(jwtExpirationInterval, "minutes");
  return {
    tokenType,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (userData) => {
  try {
    console.log("register data: ", userData);
    const MemberInstance = new Member();
    console.log(`member ${typeof Member} model: `, MemberInstance);
    const member = await MemberInstance.create(userData);
    console.log("member: ", member);
    const userTransformed = MemberInstance.transform();
    const token = generateTokenResponse(member, MemberInstance.token());
    return { token, member: userTransformed };
  } catch (error) {
    console.error(error);
    throw Member.checkDuplicateEmail(error);
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (userData) => {
  try {
    const { member, accessToken } = await Member.findAndGenerateToken(userData);
    const token = generateTokenResponse(member, accessToken);
    const userTransformed = member.transform();
    return { token, member: userTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * login with an existing member or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async (member) => {
  try {
    const accessToken = member.token();
    const token = generateTokenResponse(member, accessToken);
    const userTransformed = member.transform();
    return { token, member: userTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * Returns a new jwt when given a valid refresh token
 * @public
 */
exports.refresh = async ({ email, refreshToken }) => {
  try {
    const refreshObject = await RefreshToken.findOneAndRemove({
      userEmail: email,
      token: refreshToken,
    });
    const { member, accessToken } = await Member.findAndGenerateToken({
      email,
      refreshObject,
    });
    return generateTokenResponse(member, accessToken);
  } catch (error) {
    throw error;
  }
};
