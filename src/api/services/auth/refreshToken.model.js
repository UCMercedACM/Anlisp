const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const moment = require("moment-timezone");

const { sequelize } = require("../../../config/postgres");

/**
 * Refresh Token Schema
 * @private
 */
const refreshTokenSchema = sequelize.define(
  "refreshTokens",
  {
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    memberId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    memberEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      is: /^\S+@\S+\.\S+$/i,
    },
    expires: { type: DataTypes.DATE },
  },
  {
    /**
     * Methods
     */
    classMethods: {
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
      },
    },
    instanceMethods: {},
  }
);

/**
 * @typedef RefreshToken
 */
module.exports = refreshTokenSchema;
