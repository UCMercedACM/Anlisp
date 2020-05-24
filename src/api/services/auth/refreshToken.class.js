const crypto = require("crypto");
const moment = require("moment-timezone");

const { Model } = require("../../../config/postgres");

class RefreshToken extends Model {
  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {User} user
   * @returns {RefreshToken}
   */
  generate(user) {
    const userId = user._id;
    const userEmail = user.email;
    const token = `${userId}.${crypto.randomBytes(40).toString("hex")}`;
    const expires = moment().add(30, "days").toDate();
    const tokenObject = new RefreshToken({
      token,
      userId,
      userEmail,
      expires,
    });
    tokenObject.save();
    return tokenObject;
  }
}

/**
 * @typedef RefreshToken
 */
module.exports = RefreshToken;
