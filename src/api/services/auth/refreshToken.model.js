const { DataTypes } = require("sequelize");
const crypto = require("crypto");
const moment = require("moment-timezone");

const { sequelize, Model } = require("../../../config/postgres");
const { env } = require("../../../config/variables");

class RefreshToken extends Model {
  /**
   * Generate a refresh token object and saves it into the database
   *
   * @param {Member} member
   * @returns {RefreshToken}
   */
  generate(member) {
    const memberId = member.id;
    const memberEmail = member.email;
    const token = `${memberId}.${crypto.randomBytes(40).toString("hex")}`;
    const expires = moment().add(30, "days").toDate();
    const tokenObject = new RefreshToken({
      token,
      member_id: memberId,
      member_email: memberEmail,
      expires,
    });
    return tokenObject;
  }
}

/**
 * Refresh Token Schema
 * @private
 */
RefreshToken.init(
  {
    token: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    member_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    member_email: {
      type: DataTypes.STRING,
      allowNull: false,
      is: /^\S+@\S+\.\S+$/i,
    },
    expires: { type: DataTypes.DATE },
  },
  {
    // Sequelize instance
    sequelize,

    // The name of the model. The model will be stored in `sequelize.models` under this name.
    // This defaults to class name i.e. Member in this case. This will control name of auto-generated
    // foreignKey and association naming
    modelName: "RefreshToken",

    // define the table's name
    tableName: "refresh_tokens",

    comment: "Table contains all refresh tokens",
  }
);

RefreshToken.sync({ force: env !== "production" });

/**
 * @typedef RefreshToken
 */
module.exports = { RefreshToken };
