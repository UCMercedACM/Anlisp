const moment = require("moment-timezone");

const { Member } = require("../member/member.model");
const { RefreshToken } = require("./refreshToken.model");
const { jwtExpirationInterval } = require("../../../config/variables");

const MemberInstance = new Member();
const refreshTokenInstance = new RefreshToken();

/**
 * Returns a formated object with tokens
 * @private
 */
async function generateTokenResponse(member, accessToken) {
  try {
    const tokenType = "Bearer";
    const tokenObject = await refreshTokenInstance.generate(member);
    const tokenDataValues = tokenObject.dataValues;
    const tokenData = await RefreshToken.create(tokenDataValues);
    const expiresIn = moment().add(jwtExpirationInterval, "minutes");

    return {
      tokenType,
      accessToken,
      refreshToken: tokenData.token,
      expiresIn,
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Returns jwt token if registration was successful
 * @public
 */
exports.register = async (userData) => {
  try {
    const memberData = await Member.create(userData);
    const member = memberData.dataValues;
    const memberTransformed = MemberInstance.transform(member);
    const token = await generateTokenResponse(member, MemberInstance.token());

    return { token, member: memberTransformed };
  } catch (error) {
    throw MemberInstance.checkDuplicateEmail(error);
  }
};

/**
 * Returns jwt token if valid username and password is provided
 * @public
 */
exports.login = async (memberData) => {
  try {
    const { member, accessToken } = await MemberInstance.findAndGenerateToken(
      memberData
    );
    const memberTransformed = MemberInstance.transform(member);
    const token = await generateTokenResponse(member, accessToken);

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
exports.oAuth = async (member) => {
  try {
    const memberTransformed = MemberInstance.transform(member);
    const token = generateTokenResponse(member, MemberInstance.token());

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
