const member = require("../member/member.model");
const RefreshToken = require("./refreshToken.model");
const moment = require("moment-timezone");
const { jwtExpirationInterval } = require("../../../config/vars");

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
    expiresIn
  };
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async memberData => {
  try {
    const member = await new member(memberData).save();
    const memberTransformed = member.transform();
    const token = generateTokenResponse(member, member.token());
    return { token, member: memberTransformed };
  } catch (error) {
    throw member.checkDuplicateEmail(error);
  }
};

/**
 * Returns jwt token if valid membername and password is provided
 * @public
 */
exports.login = async memberData => {
  try {
    const { member, accessToken } = await member.findAndGenerateToken(
      memberData
    );
    const token = generateTokenResponse(member, accessToken);
    const memberTransformed = member.transform();
    return { token, member: memberTransformed };
  } catch (error) {
    throw error;
  }
};

/**
 * login with an existing member or creates a new one if valid accessToken token
 * Returns jwt token
 * @public
 */
exports.oAuth = async member => {
  try {
    const accessToken = member.token();
    const token = generateTokenResponse(member, accessToken);
    const memberTransformed = member.transform();
    return { token, member: memberTransformed };
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
      memberEmail: email,
      token: refreshToken
    });
    const { member, accessToken } = await member.findAndGenerateToken({
      email,
      refreshObject
    });
    return generateTokenResponse(member, accessToken);
  } catch (error) {
    throw error;
  }
};
