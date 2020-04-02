const mongoose = require("mongoose");
const crypto = require("crypto");
const moment = require("moment-timezone");

/**
 * Refresh Token Schema
 * @private
 */
const refreshTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    index: true
  },
  memberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "member",
    required: true
  },
  memberEmail: {
    type: "String",
    ref: "member",
    required: true
  },
  expires: { type: Date }
});

refreshTokenSchema.statics = {
  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {member} member
   * @returns {RefreshToken}
   */
  generate(member) {
    const memberId = member._id;
    const memberEmail = member.email;
    const token = `${memberId}.${crypto.randomBytes(40).toString("hex")}`;
    const expires = moment()
      .add(30, "days")
      .toDate();
    const tokenObject = new RefreshToken({
      token,
      memberId,
      memberEmail,
      expires
    });
    tokenObject.save();
    return tokenObject;
  }
};

/**
 * @typedef RefreshToken
 */
const RefreshToken = mongoose.model(
  "RefreshToken",
  refreshTokenSchema,
  "refresh"
);
module.exports = RefreshToken;
