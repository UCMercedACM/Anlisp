const { omit } = require("lodash");

const User = require("./user.model");

/**
 * Get user
 * @public
 */
exports.get = async (id) => User.get(id);

/**
 * Get logged in user info
 * @public
 */
exports.loggedIn = (req, res) => res.json(req.user.transform());

/**
 * Create new user
 * @public
 */
exports.create = async (userData) => {
  try {
    const user = User.build(userData);
    const savedUser = await user.save();
    return User.transform(savedUser);
  } catch (error) {
    throw User.checkDuplicateEmail(error);
  }
};

/**
 * Replace existing user
 * @public
 */
exports.replace = async (user, newUserData) => {
  try {
    const newUser = new User(newUserData);
    const ommitRole = user.role !== "admin" ? "role" : "";
    const newUserObject = omit(newUser.toObject(), "_id", ommitRole);

    await user.update(newUserObject, { override: true, upsert: true });
    const savedUser = await User.findById(user._id);

    return savedUser.transform();
  } catch (error) {
    throw User.checkDuplicateEmail(error);
  }
};

/**
 * Update existing user
 * @public
 */
exports.update = async (user, updatedData) => {
  try {
    const ommitRole = user.role !== "admin" ? "role" : "";
    const userTobeUpdated = omit(updatedData, ommitRole);
    const updatedUser = Object.assign(user, userTobeUpdated);
    const savedUser = await updatedUser.save();
    return savedUser.transform();
  } catch (error) {
    throw User.checkDuplicateEmail(error);
  }
};

/**
 * Get user list
 * @public
 */
exports.list = async (params) => {
  try {
    const users = await User.list(params);
    const transformedUsers = users.map((user) => user.transform());
    return transformedUsers;
  } catch (error) {
    throw error;
  }
};

/**
 * Delete user
 * @public
 */
exports.remove = async (user) => user.remove();
