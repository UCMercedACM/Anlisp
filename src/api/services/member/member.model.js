const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const uuidv4 = require("uuid/v4");

const { sequelize, Model } = require("../../../config/postgres");
const APIError = require("../../utils/APIError");
// const { sequelize } = require("../../../config/postgres");
const {
  jwtSecret,
  jwtExpirationInterval,
} = require("../../../config/variables");

/**
 * Member Roles
 */
const roles = ["user", "admin"];
const urlRegex = [
  "_^(?:(?:https?|ftp)://)(?:S+(?::S*)?@)?(?:(?!10(?:.d{1,3}){3})(?!127(?:.d{1,3}){3})(?!169.254(?:.d{1,3}){2})(?!192.168(?:.d{1,3}){2})(?!172.(?:1[6-9]|2d|3[0-1])(?:.d{1,3}){2})(?:[1-9]d?|1dd|2[01]d|22[0-3])(?:.(?:1?d{1,2}|2[0-4]d|25[0-5])){2}(?:.(?:[1-9]d?|1dd|2[0-4]d|25[0-4]))|(?:(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)(?:.(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)*(?:.(?:[a-z\\x{00a1}-\\x{ffff}]{2,})))(?::d{2,5})?(?:/[^s]*)?$_iuS",
  "i",
];

/**
 * Create new Member Model
 */
class Member extends Model {
  getFullname() {
    return `${this.first_name} ${this.last_name}`;
  }

  /**
   * Get user
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Member, APIError>}
   */
  async get(id) {
    try {
      let user;

      if (DataTypes.UUID === typeof id) {
        user = await this.findById(id).exec();
      }

      if (user) {
        return user;
      }

      throw new APIError({
        message: "Member does not exist",
        status: httpStatus.NOT_FOUND,
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Transform Data
   */
  transform() {
    const transformed = {};
    const fields = [
      "id",
      "student_id",
      "firstName",
      "lastName",
      "email",
      "password",
      "year",
      "github",
      "linkedin",
      "personalWebsite",
      "stackOverflow",
      "portfolium",
      "handshake",
      "slack",
      "discord",
      "thumbnail",
      "active",
      "banned",
      "privilege",
      "joined",
    ];

    fields.forEach((field) => {
      switch (field) {
        case "created_at": {
          transformed[field] = this["created_at"];
          break;
        }
        case "updated_at": {
          transformed[field] = this["updated_at"];
          break;
        }
        case "deleted_at": {
          transformed[field] = this["deleted_at"];
          break;
        }
        default: {
          transformed[field] = this[field];
          break;
        }
      }
    });

    console.log("transformed: ", transformed);

    return transformed;
  }

  /**
   * Encrypt JWT Token
   */
  token() {
    const playload = {
      exp: moment().add(jwtExpirationInterval, "minutes").unix(),
      iat: moment().unix(),
      sub: this.id,
    };
    return jwt.encode(playload, jwtSecret);
  }

  /**
   * Return new validation error
   * if error is a postgres duplicate key error
   *
   * @param {Error} error
   * @returns {Error|APIError}
   */
  checkDuplicateEmail(error) {
    if (
      error.code === 11000 &&
      (error.name === "BulkWriteError" || error.name === "MongoError")
    ) {
      return new APIError({
        message: "Validation Error",
        errors: [
          {
            field: "email",
            location: "body",
            messages: ['"email" already exists'],
          },
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack,
      });
    }
    return error;
  }

  /**
   * Find user by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of user.
   * @returns {Promise<Member, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email)
      throw new APIError({
        message: "An email is required to generate a token",
      });

    const user = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true,
    };
    if (password) {
      if (user && (await Member.passwordMatches(password))) {
        return { user, accessToken: user.token() };
      }
      err.message = "Incorrect email or password";
    } else if (refreshObject && refreshObject.userEmail === email) {
      return { user, accessToken: user.token() };
    } else {
      err.message = "Incorrect email or refreshToken";
    }
    throw new APIError(err);
  }

  /**
   * List users in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of users to be skipped.
   * @param {number} limit - Limit number of users to be returned.
   * @returns {Promise<Member[]>}
   */
  list({ page = 1, perPage = 30, name, email, role }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  }

  /**
   * Login via Social Media accounts
   */
  async oAuthLogin({ service, id, email, name, picture }) {
    const user = await this.findOne({
      $or: [{ [`services.${service}`]: id }, { email }],
    });
    if (user) {
      user.services[service] = id;
      if (!user.name) user.name = name;
      if (!user.picture) user.picture = picture;
      return user.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id },
      email,
      password,
      name,
      picture,
    });
  }

  /**
   * Check if password already matches previous
   */
  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  }
}

/**
 * Member Schema
 * @private
 */
Member.init(
  {
    // attributes
    student_id: {
      type: DataTypes.STRING,
      // allowNull: false,
      // unique: true,
      required: false,
    },
    first_name: {
      type: DataTypes.STRING,
      // allowNull: false,
      required: false,
    },
    last_name: {
      type: DataTypes.STRING,
      // allowNull: false,
      required: false,
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
    },
    year: {
      type: DataTypes.STRING,
      required: false,
    },
    github: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    linkedin: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    personal_website: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    stack_overflow: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    portfolium: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    handshake: {
      type: DataTypes.STRING,
      is: urlRegex,
      required: false,
    },
    slack: {
      type: DataTypes.STRING,
      required: false,
    },
    discord: {
      type: DataTypes.STRING,
      required: false,
    },
    thumbnail: {
      type: DataTypes.BLOB,
    },
    active: {
      type: DataTypes.BOOLEAN,
      required: false,
    },
    banned: {
      type: DataTypes.BOOLEAN,
      required: false,
    },
    privilege: {
      type: DataTypes.ENUM(...roles),
      required: false,
    },
  },
  {
    // Sequelize instance
    sequelize,

    // The name of the model. The model will be stored in `sequelize.models` under this name.
    // This defaults to class name i.e. Member in this case. This will control name of auto-generated
    // foreignKey and association naming
    modelName: "Member",

    // define the table's name
    tableName: "members",

    comment: "Table contains all information on members",
  }
);

/**
 * Hash Password
 *
 * Storing passwords in plaintext in the database is terrible.
 * Hashing the value with an appropriate cryptographic hash function is better.
 */
// Member.beforeCreate(async (memberInstance) => {
//   memberInstance.password = await bcrypt.hash(
//     memberInstance.password,
//     env === "test" ? 1 : 10
//   );
// });

// Member
//   .create({ name: 'John Doe', title: 'senior engineer' })
//   .then(employee => {
//     console.log(employee.get('name')); // John Doe (SENIOR ENGINEER)
//     console.log(employee.get('title')); // SENIOR ENGINEER
//   })

/**
 * @typedef Member
 */
module.exports = { Member, roles };
