const { DataTypes } = require("sequelize");

const { sequelize } = require("../../../config/postgres");
const RefreshToken = require("./refreshToken.class");

/**
 * Refresh Token Schema
 * @private
 */
RefreshToken.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    // Sequelize instance
    sequelize,

    // The name of the model. The model will be stored in `sequelize.models` under this name.
    // This defaults to class name i.e. Member in this case. This will control name of auto-generated
    // foreignKey and association naming
    modelName: "RefreshToken",

    // define the table's name
    tableName: "refreshTokens",

    comment: "Table contains all refresh tokens",
  }
);

/**
 * @typedef RefreshToken
 */
module.exports = { RefreshToken };
