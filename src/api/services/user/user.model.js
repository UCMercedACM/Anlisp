const { DataTypes } = require("sequelize");
const httpStatus = require("http-status");
const { omitBy, isNil } = require("lodash");
const bcrypt = require("bcryptjs");
const moment = require("moment-timezone");
const jwt = require("jwt-simple");
const uuidv4 = require("uuid/v4");

const { sequelize } = require("../../../config/postgres");
const APIError = require("../../utils/APIError");
const {
  env,
  jwtSecret,
  jwtExpirationInterval,
} = require("../../../config/variables");

/**
 * User Roles
 */
const roles = ["user", "admin"];
const urlRegex = [
  "_^(?:(?:https?|ftp)://)(?:S+(?::S*)?@)?(?:(?!10(?:.d{1,3}){3})(?!127(?:.d{1,3}){3})(?!169.254(?:.d{1,3}){2})(?!192.168(?:.d{1,3}){2})(?!172.(?:1[6-9]|2d|3[0-1])(?:.d{1,3}){2})(?:[1-9]d?|1dd|2[01]d|22[0-3])(?:.(?:1?d{1,2}|2[0-4]d|25[0-5])){2}(?:.(?:[1-9]d?|1dd|2[0-4]d|25[0-4]))|(?:(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)(?:.(?:[a-z\\x{00a1}-\\x{ffff}0-9]+-?)*[a-z\\x{00a1}-\\x{ffff}0-9]+)*(?:.(?:[a-z\\x{00a1}-\\x{ffff}]{2,})))(?::d{2,5})?(?:/[^s]*)?$_iuS",
  "i",
];

const userSchema = sequelize.define(
  "member",
  {
    studentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    lastName: {
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
        const hash = await bcrypt.hash(value, 1);
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
    personalWebsite: {
      type: DataTypes.STRING,
      is: urlRegex,
    },
    stackOverflow: {
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
      type: DataTypes.STRING,
    },
  },
  {
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",

    /**
     * Methods
     */
    classMethods: {
      /**
       * Get user
       *
       * @param {ObjectId} id - The objectId of user.
       * @returns {Promise<User, APIError>}
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
            message: "User does not exist",
            status: httpStatus.NOT_FOUND,
          });
        } catch (error) {
          throw error;
        }
      },

      transform: (user) => {
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
            field === "joined" ? user["created_at"] : user[field];
        });

        console.log("transformed: ", transformed);

        return transformed;
      },

      token: () => {
        const playload = {
          exp: moment().add(jwtExpirationInterval, "minutes").unix(),
          iat: moment().unix(),
          sub: this._id,
        };
        return jwt.encode(playload, jwtSecret);
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
                messages: ['"email" already exists'],
              },
            ],
            status: httpStatus.CONFLICT,
            isPublic: true,
            stack: error.stack,
          });
        }
        return error;
      },

      /**
       * Find user by email and tries to generate a JWT token
       *
       * @param {ObjectId} id - The objectId of user.
       * @returns {Promise<User, APIError>}
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
          if (user && (await User.passwordMatches(password))) {
            return { user, accessToken: user.token() };
          }
          err.message = "Incorrect email or password";
        } else if (refreshObject && refreshObject.userEmail === email) {
          return { user, accessToken: user.token() };
        } else {
          err.message = "Incorrect email or refreshToken";
        }
        throw new APIError(err);
      },

      /**
       * List users in descending order of 'createdAt' timestamp.
       *
       * @param {number} skip - Number of users to be skipped.
       * @param {number} limit - Limit number of users to be returned.
       * @returns {Promise<User[]>}
       */
      list({ page = 1, perPage = 30, name, email, role }) {
        const options = omitBy({ name, email, role }, isNil);

        return this.find(options)
          .sort({ createdAt: -1 })
          .skip(perPage * (page - 1))
          .limit(perPage)
          .exec();
      },

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
      },
    },
    instanceMethods: {
      passwordMatches: async (password) => {
        return bcrypt.compare(password, this.password);
      },
    },
  }
);

/**
 * Add your
 * - pre-save hooks
 * - validations
 * - virtuals
 */
// userSchema.pre("save", async function save(next) {
//   try {
//     if (!this.isModified("password")) return next();

//     const rounds = env === "test" ? 1 : 10;

//     const hash = await bcrypt.hash(this.password, rounds);
//     this.password = hash;

//     console.log("this: ", this.password);

//     return next();
//   } catch (error) {
//     return next(error);
//   }
// });

/**
 * Statics
 */
// userSchema.statics = {
//   roles,
// };

/**
 * @typedef User
 */
module.exports = { userSchema, roles };
