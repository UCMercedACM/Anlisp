const { Sequelize, DataTypes } = require("sequelize");
const sequelize = new Sequelize("sqlite::memory:");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const uuidv4 = require("uuid/v4");
const APIError = require("src/api/utils/APIError");
const {
  env,
  jwtSecret,
  jwtExpirationInterval
} = require("src/config/variables.js");

/**
 * Member Roles
 */
const roles = ["member", "admin"];

/**
 * Member Schema
 * @private
 */
const memberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      match: /^\S+@\S+\.\S+$/,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      maxlength: 128
    },
    name: {
      type: String,
      maxlength: 128,
      index: true,
      trim: true
    },
    services: {
      facebook: String,
      google: String
    },
    role: {
      type: String,
      enum: roles,
      default: "member"
    },
    picture: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
memberSchema.pre("save", async function save(next) {
  try {
    if (!this.isModified("password")) return next();

    const rounds = env === "test" ? 1 : 10;

    const hash = await bcrypt.hash(this.password, rounds);
    this.password = hash;

    return next();
  } catch (error) {
    return next(error);
  }
});

/**
 * Methods
 */
memberSchema.method({
  transform() {
    const transformed = {};
    const fields = ["id", "name", "email", "picture", "role", "createdAt"];

    fields.forEach(field => {
      transformed[field] = this[field];
    });

    return transformed;
  },

  token() {
    const playload = {
      exp: moment()
        .add(jwtExpirationInterval, "minutes")
        .unix(),
      iat: moment().unix(),
      sub: this._id
    };
    return jwt.encode(playload, jwtSecret);
  },

  async passwordMatches(password) {
    return bcrypt.compare(password, this.password);
  }
});

/**
 * Statics
 */
memberSchema.statics = {
  roles,

  /**
   * Get member
   *
   * @param {ObjectId} id - The objectId of member.
   * @returns {Promise<member, APIError>}
   */
  async get(id) {
    try {
      let member;

      if (mongoose.Types.ObjectId.isValid(id)) {
        member = await this.findById(id).exec();
      }

      if (member) {
        return member;
      }

      throw new APIError({
        message: "member does not exist",
        status: httpStatus.NOT_FOUND
      });
    } catch (error) {
      throw error;
    }
  },

  /**
   * Find member by email and tries to generate a JWT token
   *
   * @param {ObjectId} id - The objectId of member.
   * @returns {Promise<member, APIError>}
   */
  async findAndGenerateToken(options) {
    const { email, password, refreshObject } = options;
    if (!email)
      throw new APIError({
        message: "An email is required to generate a token"
      });

    const member = await this.findOne({ email }).exec();
    const err = {
      status: httpStatus.UNAUTHORIZED,
      isPublic: true
    };
    if (password) {
      if (member && (await member.passwordMatches(password))) {
        return { member, accessToken: member.token() };
      }
      err.message = "Incorrect email or password";
    } else if (refreshObject && refreshObject.memberEmail === email) {
      return { member, accessToken: member.token() };
    } else {
      err.message = "Incorrect email or refreshToken";
    }
    throw new APIError(err);
  },

  /**
   * List members in descending order of 'createdAt' timestamp.
   *
   * @param {number} skip - Number of members to be skipped.
   * @param {number} limit - Limit number of members to be returned.
   * @returns {Promise<member[]>}
   */
  list({ page = 1, perPage = 30, name, email, role }) {
    const options = omitBy({ name, email, role }, isNil);

    return this.find(options)
      .sort({ createdAt: -1 })
      .skip(perPage * (page - 1))
      .limit(perPage)
      .exec();
  },

  /**
   * Return new validation error
   * if error is a mongoose duplicate key error
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
            messages: ['"email" already exists']
          }
        ],
        status: httpStatus.CONFLICT,
        isPublic: true,
        stack: error.stack
      });
    }
    return error;
  },

  async oAuthLogin({ service, id, email, name, picture }) {
    const member = await this.findOne({
      $or: [{ [`services.${service}`]: id }, { email }]
    });
    if (member) {
      member.services[service] = id;
      if (!member.name) member.name = name;
      if (!member.picture) member.picture = picture;
      return member.save();
    }
    const password = uuidv4();
    return this.create({
      services: { [service]: id },
      email,
      password,
      name,
      picture
    });
  }
};

/**
 * @typedef member
 */
module.exports = mongoose.model("member", memberSchema, "members");
