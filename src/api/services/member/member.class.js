const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const uuidv4 = require("uuid/v4");

const { Model } = require("../../../config/postgres");
const APIError = require("../../utils/APIError");
const {
  jwtSecret,
  jwtExpirationInterval,
} = require("../../../config/variables");

/**
 * Create new Member Model
 */
class Member extends Model {
  getFullname() {
    return [this.firstname, this.lastname].join(" ");
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

      if (mongoose.Types.ObjectId.isValid(id)) {
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
  transform(member) {
    const transformed = {};
    const fields = [
      "id",
      "studentId",
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
      transformed[field] =
        field === "joined" ? member["created_at"] : member[field];
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
      sub: this._id,
    };
    return jwt.encode(playload, jwtSecret);
  }

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
 * @typedef Member
 */
module.exports = Member;
