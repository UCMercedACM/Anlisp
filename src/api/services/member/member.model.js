const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

const { Member } = require("./member.class");
const { sequelize } = require("../../../config/postgres");
const { env } = require("../../../config/variables");

/**
 * Member Roles
 */
const roles = ["user", "admin"];
const urlRegex = [
  "_^(?:(?:https?|ftp)://)(?:S+(?::S*)?@)?(?:(?!10(?:.d{1,3}){3})(?!127(?:.d{1,3}){3})(?!169.254(?:.d{1,3}){2})(?!192.168(?:.d{1,3}){2})(?!172.(?:1[6-9]|2d|3[0-1])(?:.d{1,3}){2})(?:[1-9]d?|1dd|2[01]d|22[0-3])(?:.(?:1?d{1,2}|2[0-4]d|25[0-5])){2}(?:.(?:[1-9]d?|1dd|2[0-4]d|25[0-4]))|(?:(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)(?:.(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)*(?:.(?:[a-z\\x{00a1}-\\x{ffff}]{2,})))(?::d{2,5})?(?:/[^s]*)?$_iuS",
  "i",
];

Member.init(
  {
    // attributes
    id: {
      type: type.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    student_id: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    first_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      is: /^\S+@\S+\.\S+$/i,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      set: async (value) => {
        const hash = await bcrypt.hash(value, env === "test" ? 1 : 10);
        // Storing passwords in plaintext in the database is terrible.
        // Hashing the value with an appropriate cryptographic hash function is better.
        this.setDataValue("password", hash);
      },
    },
    year: {
      type: DataTypes.STRING,
    },
    github: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    linkedin: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    personal_website: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    stack_overflow: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    portfolium: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    handshake: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    slack: {
      type: DataTypes.STRING,
    },
    discord: {
      type: DataTypes.STRING,
    },
    thumbnail: {
      type: DataTypes.BLOB,
    },
    active: {
      type: DataTypes.BOOLEAN,
    },
    banned: {
      type: DataTypes.BOOLEAN,
    },
    privilege: {
      type: DataTypes.ENUM(...roles),
    },
  },
  {
    // Sequelize instance
    sequelize,

    // The name of the model. The model will be stored in `sequelize.models` under this name.
    // This defaults to class name i.e. Member in this case. This will control name of auto-generated
    // foreignKey and association naming
    modelName: "member",

    // define the table's name
    tableName: "members",

    comment: "Table contains all information on members",
  }
);

/**
 * @typedef Member
 */
module.exports = { Member, roles };
